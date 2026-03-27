# Esquema de Base de Datos — 55mas v1

## Estrategia de traducciones

### Contenido estático (UI, labels, landing pages)
- **next-intl** con archivos JSON en `src/lib/i18n/messages/{locale}.json`
- Versionado en git, type-safe, no depende de DB

### Contenido dinámico (servicios, formularios)
- **Tablas `_translations` dedicadas por entidad** con columnas tipadas
- Cada fila = un idioma. Agregar idioma = agregar filas, sin tocar datos existentes
- FK real sobre `languages(code)`, NOT NULL en campos obligatorios

### Formularios dinámicos
- Schema JSONB almacena **solo estructura** (tipos de campo, keys, validaciones)
- Traducciones de labels/placeholders/opciones en tabla `service_form_translations`, una fila por idioma
- Separación total entre estructura y texto visible

### Fallback chain al leer
locale solicitado → locale default del país → 'es'

---

## Orden de creación de tablas

Las tablas deben crearse en este orden para respetar dependencias de FK:

1. `languages` — sin dependencias
2. `countries` + `country_translations` — depende de `languages`
3. `cities` + `city_translations` — depende de `countries`, `languages`
4. `staff_roles` — sin dependencias (seed obligatorio antes del primer miembro)
5. `profiles` + `user_roles` + `staff_role_scopes` — depende de `countries`, `staff_roles`, `cities`
6. `categories` + `category_translations` — depende de `languages`
7. `services` + `service_translations` + `service_countries` — depende de `countries`, `languages`
8. `service_forms` + `service_form_translations` — depende de `services`, `countries`, `languages`
9. `talent_profiles` + `talent_services` + `talent_analytics` + `service_subtype_groups` + `service_subtype_group_translations` + `service_subtypes` + `talent_service_subtypes` — depende de `profiles`, `countries`, `cities`, `services`, `languages`
9.5. `talent_forms` + `talent_form_translations` — depende de `services`, `cities`, `languages`
9.6. `registration_forms` + `registration_form_translations` + `registration_form_countries` + `registration_form_cities` — depende de `cities`, `countries`, `languages`
10. `orders` + tablas relacionadas — depende de `profiles`, `services`, `countries`, `cities`, `service_forms`
11. Triggers
12. `ENABLE ROW LEVEL SECURITY`
13. Índices
14. Views

---

## Seed data obligatorio

Las siguientes tablas **deben** tener datos antes de que cualquier usuario se registre. Sin ellos, las FKs de `preferred_locale` y `locale_default` fallan al primer signup.

### languages

| code | name | is_active | sort_order |
|------|------|-----------|------------|
| es | Español | true | 0 |
| en | English | true | 1 |
| pt | Português | true | 2 |
| fr | Français | true | 3 |
| ca | Català | true | 4 |

### countries (+ `country_translations` para cada idioma activo)

| code | currency | timezone | locale_default |
|------|----------|----------|----------------|
| ES | EUR | Europe/Madrid | es |
| PT | EUR | Europe/Lisbon | pt |
| FR | EUR | Europe/Paris | fr |
| AR | ARS | America/Argentina/Buenos_Aires | es |
| MX | MXN | America/Mexico_City | es |
| CO | COP | America/Bogota | es |

Este seed data forma parte de la **migración base**, no es opcional.

### staff_roles

| key | display_name | sort_order |
|-----|--------------|------------|
| admin | Administrador | 0 |
| manager | Manager | 1 |
| viewer | Visualizador | 2 |

`key` es el identificador técnico inmutable (usado en código y RLS). `display_name` es editable desde el panel de admin.

### cities (ciudades principales por país — seed inicial, admin puede añadir más)

El seed incluye las ciudades principales. El admin puede añadir ciudades nuevas desde el panel.

| country | slug | name |
|---------|------|------|
| ES | madrid | Madrid |
| ES | barcelona | Barcelona |
| ES | valencia | Valencia |
| ES | sevilla | Sevilla |
| PT | lisboa | Lisboa |
| PT | porto | Porto |
| FR | paris | Paris |
| FR | lyon | Lyon |
| FR | marsella | Marsella |
| AR | buenos-aires | Buenos Aires |
| AR | cordoba | Córdoba |
| MX | ciudad-de-mexico | Ciudad de México |
| MX | guadalajara | Guadalajara |
| CO | bogota | Bogotá |
| CO | medellin | Medellín |

(+ `city_translations` para cada idioma activo)

---

## Capa 0 — Idiomas

Debe crearse **antes** que cualquier tabla que use `locale`. Valida todos los locales en DB.

```sql
CREATE TABLE languages (
  code       text PRIMARY KEY,     -- es, en, pt, fr, ca
  name       text NOT NULL,        -- Español, English, Português...
  is_active  boolean NOT NULL DEFAULT true,
  sort_order int DEFAULT 0
);
```

Todas las tablas `_translations` referencian `languages(code)` con FK, evitando typos silenciosos.

---

## Capa 1 — Países

```sql
CREATE TABLE countries (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code           text NOT NULL UNIQUE,                            -- ES, PT, FR, AR, MX, CO
  currency       text NOT NULL,                                   -- EUR, ARS, MXN, COP
  timezone       text NOT NULL DEFAULT 'Europe/Madrid',           -- IANA timezone por defecto del país
  locale_default text NOT NULL DEFAULT 'es' REFERENCES languages(code),
  is_active      boolean NOT NULL DEFAULT true,
  sort_order     int DEFAULT 0
);

CREATE TABLE country_translations (
  country_id uuid NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  locale     text NOT NULL REFERENCES languages(code),
  name       text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (country_id, locale)
);
```

---

## Capa 1.5 — Ciudades

Normaliza nombres de ciudades. Elimina problemas de matching por texto libre (mayúsculas, acentos, variantes). Todas las tablas que necesitan "ciudad" referencian esta tabla por FK.

```sql
CREATE TABLE cities (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES countries(id),
  name       text NOT NULL,           -- nombre canónico: "Barcelona"
  slug       text NOT NULL,           -- lowercase sin acentos: "barcelona"
  is_active  boolean NOT NULL DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (country_id, slug)
);

CREATE TABLE city_translations (
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  locale  text NOT NULL REFERENCES languages(code),
  name    text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (city_id, locale)
);
```

---

## Capa 2 — Identidad y multi-rol

### Roles de staff

Los roles de staff tienen clave técnica inmutable (`key`) y nombre editable desde el panel de admin (`display_name`). Deben existir antes de que se asigne cualquier miembro del equipo.

```sql
-- Definiciones de roles de staff: clave inmutable + nombre editable
CREATE TABLE staff_roles (
  key          text PRIMARY KEY,     -- 'admin', 'manager', 'viewer' (inmutable, usado en código/RLS)
  display_name text NOT NULL,        -- editable desde el panel de admin
  description  text,
  sort_order   int NOT NULL DEFAULT 0,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
```

### Perfiles y roles de usuario

Un usuario cliente/talento puede tener ambos roles. Los roles de staff (admin/manager/viewer) son exclusivos entre sí y con client/talent — requieren cuentas separadas. El rol inicial se determina por el formulario de registro.

```sql
-- Perfil base, 1:1 con auth.users
CREATE TABLE profiles (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             text,                  -- NULL para usuarios anónimos (guest)
  full_name         text,
  phone             text,
  avatar_url        text,
  preferred_locale  text DEFAULT 'es' REFERENCES languages(code),
  preferred_country uuid REFERENCES countries(id),
  active_role       text NOT NULL DEFAULT 'client'
                    CHECK (active_role IN ('client', 'talent', 'admin', 'manager', 'viewer')),
  nif               text,                  -- Tax ID (NIF en PT, DNI/CIF en ES). Compartido: clientes y talentos
  preferred_contact text                   -- Método de contacto preferido
                    CHECK (preferred_contact IN ('phone', 'whatsapp', 'email', 'messenger')),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- Roles que el usuario tiene habilitados
CREATE TABLE user_roles (
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('client', 'talent', 'admin', 'manager', 'viewer')),
  granted_by uuid REFERENCES profiles(id) ON DELETE SET NULL,  -- quién asignó el rol (para staff)
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

-- Ámbito geográfico y permisos para roles manager/viewer
-- Solo existe si el user_roles (user_id, role) correspondiente existe
CREATE TABLE staff_role_scopes (
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        text NOT NULL REFERENCES staff_roles(key),
  country_id  uuid REFERENCES countries(id),  -- NULL = todos los países
  city_id     uuid REFERENCES cities(id),    -- NULL = todas las ciudades
  -- Permisos: arrancan vacíos. Se definen feature a feature en RLS policies.
  -- Formato futuro: 'orders:read', 'orders:write', 'talents:read', etc.
  -- '{}' = sin restricciones definidas aún (acceso genérico completo)
  permissions text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, role),
  -- Solo manager/viewer tienen scope; admin tiene acceso global sin restricciones
  CHECK (role IN ('manager', 'viewer')),
  FOREIGN KEY (user_id, role) REFERENCES user_roles(user_id, role) ON DELETE CASCADE
);
```

`active_role` = el sombrero activo en la UI. El middleware lo lee para decidir qué route group mostrar.
`user_roles` = qué sombreros puede usar. `active_role` siempre debe existir en `user_roles`.
`staff_role_scopes` = ámbito (país/ciudad) y permisos futuros de un rol manager/viewer. `admin` no tiene fila aquí — acceso global.

Consistencia enforceada por:
- Trigger `validate_active_role` en profiles → impide poner un `active_role` que no exista en `user_roles`
- Trigger `validate_role_deletion` en user_roles → impide borrar un rol que sea el `active_role` actual
- Trigger `validate_staff_role_exclusive` en user_roles → impide combinar staff con client/talent, y staff entre sí

> **RLS:** Las políticas chequean `user_roles` (autorización), **nunca** `active_role` (preferencia de UI).
> - Admins: `EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')`
> - Managers/Viewers: chequear `user_roles` + JOIN `staff_role_scopes` para filtrar por scope
> - Clients: `client_id = auth.uid()`
> - Talents: `talent_id` via `talent_profiles.user_id = auth.uid()`

---

## Capa 3 — Categorías

```sql
CREATE TABLE categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text NOT NULL UNIQUE,
  icon       text,
  sort_order int DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE category_translations (
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  locale      text NOT NULL REFERENCES languages(code),
  name        text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  PRIMARY KEY (category_id, locale)
);
```

---

## Capa 4 — Servicios

Un servicio pertenece a 55mas. Su disponibilidad y precio se configura por país.

```sql
CREATE TABLE services (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text NOT NULL UNIQUE,
  category_id       uuid REFERENCES categories(id),  -- nullable, no se usa en v1
  status            text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'published', 'archived')),
  allows_recurrence boolean NOT NULL DEFAULT false,
  cover_image_url   text,                            -- URL de imagen de portada del servicio
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TABLE service_translations (
  service_id    uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  locale        text NOT NULL REFERENCES languages(code),
  name          text NOT NULL,
  description   text,
  includes      text,
  -- Contenido de la landing page del servicio
  hero_title    text,                     -- título del hero section
  hero_subtitle text,                     -- subtítulo del hero section
  benefits      jsonb DEFAULT '[]',       -- array de beneficios: [{"icon": "...", "text": "..."}]
  guarantees    jsonb DEFAULT '[]',       -- array de garantías
  faqs          jsonb DEFAULT '[]',       -- array de FAQs: [{"question": "...", "answer": "..."}]
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  PRIMARY KEY (service_id, locale)
);

-- Disponibilidad y precio plantilla por país
-- base_price es un "template price" que se copia a ciudades como acelerador UX
-- is_active se auto-calcula al guardar: true si ≥1 ciudad activa en el país
-- currency se obtiene via JOIN con countries; no se duplica aquí
CREATE TABLE service_countries (
  service_id  uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  country_id  uuid NOT NULL REFERENCES countries(id),
  base_price  numeric(10,2) NOT NULL CHECK (base_price >= 0),
  is_active   boolean NOT NULL DEFAULT true,
  PRIMARY KEY (service_id, country_id)
);

-- Disponibilidad y precio real por ciudad
-- base_price es el precio/hora real del servicio en esta ciudad
-- country_id se deriva de cities.country_id (sin denormalización)
CREATE TABLE service_cities (
  service_id  uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  city_id     uuid NOT NULL REFERENCES cities(id),
  base_price  numeric(10,2) NOT NULL CHECK (base_price >= 0),
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  PRIMARY KEY (service_id, city_id)
);
```

---

## Capa 5 — Formularios dinámicos

El formulario puede variar por ciudad (regulaciones locales, requisitos municipales). Schema almacena solo estructura.

```sql
CREATE TABLE service_forms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  city_id     uuid REFERENCES cities(id),     -- NULL = default para todas las ciudades
  schema      jsonb NOT NULL,                 -- solo estructura, sin texto
  version     int NOT NULL DEFAULT 1,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  -- NULLS NOT DISTINCT: PG15+ (Supabase). NULL == NULL en UNIQUE; evita múltiples defaults.
  UNIQUE NULLS NOT DISTINCT (service_id, city_id, version)
);

-- Traducciones de labels, placeholders y opciones del formulario
CREATE TABLE service_form_translations (
  form_id       uuid NOT NULL REFERENCES service_forms(id) ON DELETE CASCADE,
  locale        text NOT NULL REFERENCES languages(code),
  labels        jsonb NOT NULL,  -- {"field_key": "Label traducido"}
  placeholders  jsonb,           -- {"field_key": "Placeholder traducido"}
  option_labels jsonb,           -- {"field_key.option_value": "Opción traducida"}
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  PRIMARY KEY (form_id, locale)
);
```

### Ejemplo de schema (solo estructura)

```json
{
  "fields": [
    {"key": "address", "type": "text", "required": true},
    {"key": "city", "type": "text", "required": true},
    {"key": "postal_code", "type": "text", "required": true},
    {"key": "frequency", "type": "select", "options": ["once", "weekly", "monthly"]},
    {"key": "start_date", "type": "date", "required": true},
    {"key": "notes", "type": "textarea", "required": false}
  ]
}
```

### Ejemplo de service_form_translations (locale = 'es')

```json
{
  "labels": {
    "address": "Dirección",
    "city": "Ciudad",
    "postal_code": "Código postal",
    "frequency": "Frecuencia",
    "start_date": "Fecha de inicio",
    "notes": "Notas"
  },
  "placeholders": {
    "address": "Calle, número, piso",
    "notes": "Información adicional"
  },
  "option_labels": {
    "frequency.once": "Una vez",
    "frequency.weekly": "Semanal",
    "frequency.monthly": "Mensual"
  }
}
```

### Resolución del formulario para servicio X en ciudad Y

1. `WHERE service_id = X AND city_id = Y AND is_active = true`
2. Si no existe → `WHERE service_id = X AND city_id IS NULL AND is_active = true`

---

## Capa 6 — Talento

```sql
CREATE TABLE talent_profiles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  birth_date  date NOT NULL,              -- validación 55+ en app
  photo_url   text,
  address     text,
  city_id     uuid REFERENCES cities(id),
  postal_code text,
  country_id  uuid REFERENCES countries(id),  -- país donde reside/opera
  status      text NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  approved_at timestamptz,
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  -- Datos personales
  gender      text CHECK (gender IN ('male', 'female', 'other')),
  has_car     boolean DEFAULT false,
  -- Operaciones
  preferred_payment   text CHECK (preferred_payment IN ('acumulate', 'per_service', 'other')),
  professional_status text CHECK (professional_status IN ('unemployed', 'retired', 'employed', 'self_employed', 'other')),
  handler_id  uuid REFERENCES profiles(id) ON DELETE SET NULL,  -- staff member que gestiona/reclutó al talento
  internal_notes text,                    -- notas internas del equipo (solo admin/staff)
  legacy_id   integer UNIQUE,             -- ID del sistema legacy (CSV import)
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  -- Onboarding multi-step: pending/rejected permiten NULL (perfil incompleto).
  -- Para ser aprobado o suspendido, país y ciudad son obligatorios (matching de proximidad).
  CHECK (
    status IN ('pending', 'rejected')
    OR (country_id IS NOT NULL AND city_id IS NOT NULL)
  )
);

CREATE TABLE talent_profile_translations (
  talent_id   uuid NOT NULL REFERENCES talent_profiles(id) ON DELETE CASCADE,
  locale      text NOT NULL REFERENCES languages(code),
  bio         text,
  experience  text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  PRIMARY KEY (talent_id, locale)
);

-- Qué servicios ofrece un talento, por país, y a qué precio
CREATE TABLE talent_services (
  talent_id   uuid NOT NULL REFERENCES talent_profiles(id) ON DELETE CASCADE,
  service_id  uuid NOT NULL REFERENCES services(id),
  country_id  uuid NOT NULL REFERENCES countries(id),
  unit_price  numeric(10,2) CHECK (unit_price >= 0),  -- precio que cobra el talento por este servicio
  specializations jsonb DEFAULT NULL,     -- DEPRECATED: usar talent_service_subtypes. Temporal para CSV import.
  form_data   jsonb,                      -- respuestas del talento al formulario de talento
  form_id     uuid REFERENCES talent_forms(id) ON DELETE SET NULL,  -- snapshot del formulario usado
  is_verified boolean NOT NULL DEFAULT false,  -- admin verificó docs
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  PRIMARY KEY (talent_id, service_id, country_id)
);

-- Documentos subidos por el talento
CREATE TABLE talent_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id     uuid NOT NULL REFERENCES talent_profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL,          -- id_card, insurance, certificate...
  file_path     text NOT NULL,          -- Supabase Storage path
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at   timestamptz,
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Documentos requeridos por servicio+país (regulaciones)
CREATE TABLE service_required_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id    uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  country_id    uuid NOT NULL REFERENCES countries(id),
  document_type text NOT NULL,
  is_required   boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (service_id, country_id, document_type)
);

CREATE TABLE service_required_document_translations (
  document_id uuid NOT NULL REFERENCES service_required_documents(id) ON DELETE CASCADE,
  locale      text NOT NULL REFERENCES languages(code),
  label       text NOT NULL,
  description text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  PRIMARY KEY (document_id, locale)
);

-- Datos estadísticos/analytics del talento (append-only, key-value)
-- Ej: cómo encontró 55+, por qué se unió, idiomas adicionales
CREATE TABLE talent_analytics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id   uuid NOT NULL REFERENCES talent_profiles(id) ON DELETE CASCADE,
  key         text NOT NULL,              -- 'how_found', 'why_join', 'terms_accepted', etc.
  value       text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (talent_id, key)
);

-- Preguntas estadísticas (definiciones de preguntas para talent_analytics)
CREATE TABLE survey_questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key           text NOT NULL UNIQUE,           -- 'how_found', 'ease_finding_job'
  response_type text NOT NULL,                  -- 'text', 'scale_1_5', 'scale_1_10', 'single_select', 'yes_no'
  options       jsonb DEFAULT NULL,             -- para single_select
  sort_order    int NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE TABLE survey_question_translations (
  question_id  uuid NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  locale       text NOT NULL REFERENCES languages(code),
  label        text NOT NULL,
  description  text,
  option_labels jsonb,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  PRIMARY KEY (question_id, locale)
);

-- Grupos de sub-tipos (ej: "tipo_de_mascota", "tamaño")
-- Cada servicio puede tener múltiples grupos independientes
CREATE TABLE service_subtype_groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  slug        text NOT NULL,              -- 'tipo_de_mascota', 'tamano'
  sort_order  int NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (service_id, slug)
);

CREATE TABLE service_subtype_group_translations (
  group_id   uuid NOT NULL REFERENCES service_subtype_groups(id) ON DELETE CASCADE,
  locale     text NOT NULL REFERENCES languages(code),
  name       text NOT NULL,              -- 'Tipo de mascota', 'Pet type'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, locale)
);

-- Sub-tipos de servicio (items dentro de un grupo)
-- Ej: grupo "tipo_de_mascota" → items perro, gato, pez
CREATE TABLE service_subtypes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid NOT NULL REFERENCES service_subtype_groups(id) ON DELETE CASCADE,
  service_id  uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  slug        text NOT NULL,              -- 'dog', 'cat', 'fish'
  sort_order  int DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (group_id, slug)
);

CREATE TABLE service_subtype_translations (
  subtype_id  uuid NOT NULL REFERENCES service_subtypes(id) ON DELETE CASCADE,
  locale      text NOT NULL REFERENCES languages(code),
  name        text NOT NULL,              -- 'Perro', 'Dog', 'Cão'
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  PRIMARY KEY (subtype_id, locale)
);

-- Qué sub-tipos maneja cada talento (relación normalizada)
CREATE TABLE talent_service_subtypes (
  talent_id   uuid NOT NULL REFERENCES talent_profiles(id) ON DELETE CASCADE,
  subtype_id  uuid NOT NULL REFERENCES service_subtypes(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (talent_id, subtype_id)
);
```

---

## Capa 6.5 — Formularios de talento

Formularios dinámicos que el talento completa al registrarse para ofrecer un servicio.
Estructura idéntica a `service_forms` pero con FK a `talent_forms`.

```sql
CREATE TABLE talent_forms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  city_id     uuid REFERENCES cities(id),
  schema      jsonb NOT NULL DEFAULT '{"steps": []}',
  version     int NOT NULL DEFAULT 1,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (service_id, city_id, version)
);

CREATE TABLE talent_form_translations (
  form_id       uuid NOT NULL REFERENCES talent_forms(id) ON DELETE CASCADE,
  locale        text NOT NULL REFERENCES languages(code),
  labels        jsonb NOT NULL,
  placeholders  jsonb,
  option_labels jsonb,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  PRIMARY KEY (form_id, locale)
);
```

Resolución del formulario: misma lógica que service_forms (city_id específico → fallback a NULL).

---

## Capa 6.7 — Formularios de registro de talentos

Formularios dinámicos para el registro/onboarding de talentos. No atados a un servicio.
Agrupados por slug, con variantes por ciudad (parent_id → General).

```sql
CREATE TABLE registration_forms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL,
  name        text NOT NULL,
  city_id     uuid REFERENCES cities(id),
  parent_id   uuid REFERENCES registration_forms(id) ON DELETE CASCADE,
  schema      jsonb NOT NULL DEFAULT '{"steps": []}',
  version     int NOT NULL DEFAULT 1,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (slug, city_id, version)
);

CREATE TABLE registration_form_translations (
  form_id      uuid NOT NULL REFERENCES registration_forms(id) ON DELETE CASCADE,
  locale       text NOT NULL REFERENCES languages(code),
  labels       jsonb NOT NULL DEFAULT '{}',
  placeholders jsonb NOT NULL DEFAULT '{}',
  option_labels jsonb,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  PRIMARY KEY (form_id, locale)
);

CREATE TABLE registration_form_countries (
  form_id     uuid NOT NULL REFERENCES registration_forms(id) ON DELETE CASCADE,
  country_id  uuid NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (form_id, country_id)
);

CREATE TABLE registration_form_cities (
  form_id     uuid NOT NULL REFERENCES registration_forms(id) ON DELETE CASCADE,
  city_id     uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (form_id, city_id)
);
```

---

## Capa 7 — Pedidos y programación

### Generación lazy de sesiones (pull-based)

Las sesiones se generan bajo demanda via cron, no en cadena (push).

**Cron job (cada hora o diario):**
1. Busca orders activos con `next_session_date <= hoy + 7 días`
2. Crea `order_sessions` convirtiendo `time_start` + `timezone` → `timestamptz` (momento absoluto)
3. Calcula y actualiza `next_session_date`
4. Si `next_session_date > end_date` → `generation_paused = true`

**One-time vs recurring:**
- `schedule_type = 'once'` → la `order_session` se crea **inmediatamente** al confirmar el pedido (lógica de aplicación, no cron). El cron ignora estos orders.
- `schedule_type IN ('daily', 'weekly', 'monthly')` → el cron genera sesiones dentro de una ventana de 7 días.

**Condiciones de parada (anti-huérfanos):**
- `order.status IN (cancelado, completado)` → cron no lo toca
- `next_session_date > end_date` → pausa generación
- `generation_paused = true` → skip explícito

### Validación de form_data

`form_data` es NOT NULL — toda orden debe incluir los datos del formulario. `form_id` es nullable (se pone a NULL si el formulario fue eliminado, preservando `form_data` como registro histórico).

- **`form_id`** referencia la versión exacta del formulario usado al crear el pedido (snapshot). Nullable con `ON DELETE SET NULL`.
- **`form_data`** contiene las respuestas del cliente, validadas por la aplicación (Zod) contra `service_forms.schema` al momento del submit.
- **No hay validación de form_data a nivel DB** — la validación estructural de JSONB contra un schema dinámico sería frágil y duplicaría lógica. La capa de aplicación es la fuente de verdad para la validación.
- **Datos históricos:** si el formulario evoluciona (nueva versión), los datos de pedidos anteriores se mantienen intactos. El `form_id` (cuando no es NULL) permite reconstruir qué schema se usó para ese pedido.

```sql
CREATE TABLE orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  service_id          uuid REFERENCES services(id) ON DELETE SET NULL,  -- nullable: servicio puede archivarse tras crear el pedido
  country_id          uuid NOT NULL REFERENCES countries(id),
  talent_id           uuid REFERENCES profiles(id) ON DELETE SET NULL,  -- NULL hasta asignación
  form_id             uuid REFERENCES service_forms(id) ON DELETE SET NULL,  -- versión del formulario usado (snapshot); NULL si el form fue eliminado
  form_data           jsonb NOT NULL,                                   -- respuestas del cliente (validadas por app via Zod)
  -- Contacto del pedido (siempre explícito; para guests es la ÚNICA vía de comunicación)
  contact_email       text NOT NULL,                                    -- email de contacto para ESTE pedido
  contact_name        text NOT NULL,                                    -- nombre del contratante
  contact_phone       text NOT NULL,                                    -- teléfono de contacto
  contact_address     text,                                             -- dirección de contacto (puede diferir de service_address)
  -- Dirección del servicio (extraída de form_data para queries/matching)
  service_address     text,
  service_city_id     uuid REFERENCES cities(id),                       -- ciudad del servicio (normalizada)
  service_postal_code text,
  status              text NOT NULL DEFAULT 'nuevo'
                      CHECK (status IN ('nuevo', 'buscando_talento', 'asignado',
                                        'en_curso', 'completado', 'cancelado')),
  -- Pricing (snapshot al crear el pedido; currency copiada de countries en ese momento)
  price_subtotal      numeric(10,2) NOT NULL CHECK (price_subtotal >= 0),  -- coste del servicio antes de impuestos
  price_tax_rate      numeric(5,2) NOT NULL DEFAULT 0 CHECK (price_tax_rate >= 0 AND price_tax_rate <= 100),  -- porcentaje: 21.00 = 21%
  price_tax           numeric(10,2) NOT NULL DEFAULT 0 CHECK (price_tax >= 0),      -- importe de impuestos calculado
  price_total         numeric(10,2) NOT NULL CHECK (price_total >= 0),     -- subtotal + tax
  currency            text NOT NULL,                                        -- snapshot de countries.currency al crear
  schedule_type       text NOT NULL DEFAULT 'once'
                      CHECK (schedule_type IN ('once', 'daily', 'weekly', 'monthly')),
  notes               text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE TABLE order_schedules (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  start_date        date NOT NULL,
  end_date          date,                    -- NULL = indefinido
  time_start        time NOT NULL,           -- hora local; interpretar con timezone
  time_end          time,
  timezone          text NOT NULL,           -- IANA: 'Europe/Madrid', 'America/Argentina/Buenos_Aires'
  weekdays          int[] CHECK (
                      weekdays <@ ARRAY[1,2,3,4,5,6,7]  -- ISO 8601: 1=lun, 7=dom
                    ),
  day_of_month      int CHECK (day_of_month BETWEEN 1 AND 31),
  next_session_date date,                    -- próxima sesión a generar
  generation_paused boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TABLE order_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  scheduled_start timestamptz NOT NULL,      -- momento absoluto (schedule time_start + timezone)
  scheduled_end   timestamptz,
  local_timezone  text NOT NULL,             -- para display en UI
  status          text NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  talent_id       uuid REFERENCES profiles(id) ON DELETE SET NULL,  -- permite sustitución por sesión
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  -- Idempotencia: el cron no puede crear sesiones duplicadas
  UNIQUE (order_id, scheduled_start)
);

CREATE TABLE order_status_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status text,
  to_status   text NOT NULL,
  changed_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes       text,
  created_at  timestamptz DEFAULT now()
);
```

---

## Capa 8 — Triggers

### updated_at automático

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Aplicar a todas las tablas con updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON cities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON staff_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON staff_role_scopes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON service_forms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON service_required_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON talent_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON talent_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON talent_services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON order_schedules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON order_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Tablas de traducciones
CREATE TRIGGER set_updated_at BEFORE UPDATE ON country_translations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON city_translations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON category_translations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON service_translations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON service_form_translations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON talent_profile_translations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON service_required_document_translations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON survey_questions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON survey_question_translations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON service_subtype_groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON service_subtype_group_translations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON service_subtypes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON service_subtype_translations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON talent_forms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON talent_form_translations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### Sincronización con auth.users

```sql
-- Crea profile + rol inicial automáticamente al registrarse en Supabase Auth.
-- También se dispara para usuarios anónimos (signInAnonymously):
--   NEW.email = NULL → profiles.email queda NULL (ahora nullable)
--   raw_user_meta_data estará vacío → _role = 'client'
-- El rol se lee de raw_user_meta_data.role (seteado en el form de registro).
-- Si no viene o es inválido, default 'client'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  _role text;
BEGIN
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');

  -- Solo client y talent pueden auto-registrarse.
  -- admin/manager/viewer se otorgan manualmente desde el panel de gestión de miembros.
  IF _role NOT IN ('client', 'talent') THEN
    _role := 'client';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, active_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    _role
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sincroniza email si el usuario lo cambia en Auth
CREATE OR REPLACE FUNCTION public.handle_user_email_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_change();
```

### Validación de consistencia active_role ↔ user_roles

```sql
-- Previene poner un active_role que no existe en user_roles
CREATE OR REPLACE FUNCTION public.validate_active_role()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = NEW.id AND role = NEW.active_role
  ) THEN
    RAISE EXCEPTION 'active_role "%" not in user_roles for user %', NEW.active_role, NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_active_role BEFORE UPDATE OF active_role ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_active_role();

-- Previene borrar un rol que sea el active_role actual del usuario
CREATE OR REPLACE FUNCTION public.validate_role_deletion()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = OLD.user_id AND active_role = OLD.role
  ) THEN
    RAISE EXCEPTION 'Cannot delete role "%" — it is the active_role for user %', OLD.role, OLD.user_id;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER check_role_deletion BEFORE DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_role_deletion();
```

### Exclusividad staff ↔ client/talent

```sql
-- Impide combinar roles staff (admin/manager/viewer) con client/talent, y staff entre sí.
-- Los roles de staff requieren cuentas dedicadas.
CREATE OR REPLACE FUNCTION public.validate_staff_role_exclusive()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role IN ('admin', 'manager', 'viewer') THEN
    -- No puede tener otro rol de ningún tipo
    IF EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = NEW.user_id
        AND role <> NEW.role
    ) THEN
      RAISE EXCEPTION 'User % already has a role; staff roles require a dedicated account', NEW.user_id;
    END IF;
  ELSE
    -- Es client o talent: no puede tener roles de staff
    IF EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = NEW.user_id
        AND role IN ('admin', 'manager', 'viewer')
    ) THEN
      RAISE EXCEPTION 'User % has a staff role; cannot add client/talent roles', NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_staff_role_exclusive BEFORE INSERT ON user_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_staff_role_exclusive();
```

### Validación cruzada city ↔ country

```sql
-- Impide que city_id apunte a una ciudad de un país distinto a country_id.
-- Aplica a talent_profiles y staff_role_scopes (ambas usan city_id + country_id).
CREATE OR REPLACE FUNCTION public.validate_city_country_match()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.city_id IS NOT NULL AND NEW.country_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM cities WHERE id = NEW.city_id AND country_id = NEW.country_id
    ) THEN
      RAISE EXCEPTION 'city_id % does not belong to country_id %', NEW.city_id, NEW.country_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_city_country_match BEFORE INSERT OR UPDATE ON talent_profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_city_country_match();

CREATE TRIGGER check_city_country_match BEFORE INSERT OR UPDATE ON staff_role_scopes
  FOR EACH ROW EXECUTE FUNCTION public.validate_city_country_match();

-- Versión específica para orders: usa service_city_id en lugar de city_id
CREATE OR REPLACE FUNCTION public.validate_order_city_country_match()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.service_city_id IS NOT NULL AND NEW.country_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM cities WHERE id = NEW.service_city_id AND country_id = NEW.country_id
    ) THEN
      RAISE EXCEPTION 'service_city_id % does not belong to country_id %', NEW.service_city_id, NEW.country_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_order_city_country_match BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_city_country_match();
```

---

## Capa 9 — Row Level Security

> **Estado actual (dev):** RLS está **pendiente de implementar**. Ninguna tabla tiene `rowsecurity = true` en el proyecto dev. El SQL de activación se incluye aquí como referencia de lo que debe aplicarse antes de producción.

RLS debe estar activado en todas las tablas públicas. Sin esto, las políticas no se aplican.
Las políticas concretas se definen en cada feature, pero la activación va en la migración base.

```sql
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_role_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_form_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_profile_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_question_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_subtype_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_subtype_group_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_subtypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_subtype_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_service_subtypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_form_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_required_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_required_document_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
```

> **Nota:** Las tablas de solo lectura pública (`countries`, `cities`, `services` publicados) necesitarán una policy `SELECT` para `anon` y `authenticated`. Las tablas privadas (`orders`, `talent_documents`) solo permiten acceso al dueño + admins.
>
> **Nota anon auth (guests):** Los usuarios anónimos (`signInAnonymously()`) tienen `auth.uid()` y role `client`. RLS funciona normalmente. Su policy INSERT en `orders` es la misma que para clientes registrados: `client_id = auth.uid()`.
>
> **Nota staff_roles:** Lectura pública para todos los usuarios autenticados (para mostrar nombres en UI). Escritura solo para admin.
>
> **Patrón RLS para manager/viewer (ejemplo con `orders`):**
> ```sql
> -- Admin: acceso total
> EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
> -- Manager/Viewer: filtrado por scope (country + city) definido en staff_role_scopes
> EXISTS (
>   SELECT 1 FROM user_roles ur
>   JOIN staff_role_scopes srs ON srs.user_id = ur.user_id AND srs.role = ur.role
>   WHERE ur.user_id = auth.uid()
>     AND ur.role IN ('manager', 'viewer')
>     AND (srs.country_id IS NULL OR srs.country_id = orders.country_id)
>     AND (srs.city_id IS NULL OR srs.city_id = orders.service_city_id)
> )
> -- Restricciones de escritura por rol (viewer = no write) se añaden feature a feature
> ```

---

## Índices recomendados

```sql
-- Búsquedas frecuentes en catálogo
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_service_countries_active ON service_countries(country_id) WHERE is_active = true;
CREATE INDEX idx_service_cities_active ON service_cities(service_id) WHERE is_active = true;
CREATE INDEX idx_service_translations_locale ON service_translations(locale);

-- Pedidos por cliente, estado, país y ubicación
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_country ON orders(country_id);
CREATE INDEX idx_orders_talent ON orders(talent_id);
CREATE INDEX idx_orders_city ON orders(service_city_id);
CREATE INDEX idx_orders_contact_email ON orders(contact_email);

-- Sesiones por momento (para el cron y agenda)
CREATE INDEX idx_order_sessions_start ON order_sessions(scheduled_start);
CREATE INDEX idx_order_schedules_next ON order_schedules(next_session_date)
  WHERE generation_paused = false;

-- Talento por servicio+país y ubicación
CREATE INDEX idx_talent_services_lookup ON talent_services(service_id, country_id);
CREATE INDEX idx_talent_profiles_city ON talent_profiles(city_id);
CREATE INDEX idx_talent_profiles_country ON talent_profiles(country_id);

-- Staff: lookups de scope por país y ciudad
CREATE INDEX idx_staff_role_scopes_country ON staff_role_scopes(country_id);
CREATE INDEX idx_staff_role_scopes_city ON staff_role_scopes(city_id);

-- Ciudades por país
CREATE INDEX idx_cities_country ON cities(country_id);
```

---

## Views de conveniencia

> **INNER JOIN intencional:** Las views usan INNER JOIN, no LEFT JOIN. Si una entidad no tiene traducción para un locale, **no aparece** en esa vista para ese idioma. Esto es por diseño: una entidad sin traducción completa se considera en desarrollo y no debe mostrarse en el catálogo público. La completitud de traducciones es responsabilidad del flujo editorial en el admin.

```sql
-- Servicios con traducción, listos para queries del catálogo
CREATE VIEW services_localized AS
SELECT s.id, s.slug, s.category_id, s.status, s.allows_recurrence,
       st.locale, st.name, st.description, st.includes
FROM services s
JOIN service_translations st ON st.service_id = s.id;

-- Nota: los campos hero_title, hero_subtitle, benefits, guarantees, faqs de service_translations
-- y cover_image_url de services no están incluidos en esta view. Consultarlos directamente
-- en service_translations cuando se necesiten para landing pages de servicio.

-- Categorías con traducción
CREATE VIEW categories_localized AS
SELECT c.id, c.slug, c.icon, c.sort_order, c.is_active,
       ct.locale, ct.name
FROM categories c
JOIN category_translations ct ON ct.category_id = c.id;

-- Ciudades con traducción
CREATE VIEW cities_localized AS
SELECT ci.id, ci.country_id, ci.slug, ci.is_active, ci.sort_order,
       ct.locale, ct.name
FROM cities ci
JOIN city_translations ct ON ct.city_id = ci.id;

-- Países con traducción
CREATE VIEW countries_localized AS
SELECT c.id, c.code, c.currency, c.timezone, c.locale_default,
       c.is_active, c.sort_order,
       ct.locale, ct.name
FROM countries c
JOIN country_translations ct ON ct.country_id = c.id;
```

---

## Funciones utilitarias

Funciones almacenadas en `public` que encapsulan operaciones de negocio complejas. No son triggers.

| Función | Descripción |
|---------|-------------|
| `delete_service(service_id uuid)` | Elimina un servicio en cascada (traducciones, formularios, disponibilidad). Usar en lugar de `DELETE` directo. |
| `save_service_config(...)` | Guarda la configuración de un servicio (países, ciudades, precios) en una transacción atómica. Usada por el panel de admin. |

---

## Decisiones registradas

```
┌─────────────────────────────────┬────────────────────────────────────────────────────┐
│            Decisión             │                       Razón                        │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ active_role en profiles (no     │ Source of truth en DB, auditable, persistente      │
│ cookie)                         │                                                    │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Tablas _translations dedicadas  │ i18n es core del negocio; escalable a N idiomas;   │
│ (no JSONB)                      │ flujo de traducción limpio                         │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Form schema sin texto visible   │ Separar estructura de traducciones; evita          │
│                                 │ manipulación quirúrgica de JSONB                   │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Generación lazy pull-based de   │ Sin procesos huérfanos; idempotente; resiliente a  │
│ sesiones                        │ fallos del cron                                    │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Ventana de 7 días para          │ Balance entre visibilidad de calendario y no       │
│ generación                      │ generar sesiones innecesarias                      │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ order_sessions.talent_id        │ Permite sustitución de talento por sesión sin      │
│ independiente                   │ cambiar el pedido                                  │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ UNIQUE NULLS NOT DISTINCT en    │ PG15+ (Supabase). Sin esto, NULL != NULL en        │
│ service_forms                   │ UNIQUE: múltiples formularios default con mismo    │
│                                 │ service+version                                    │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ timestamptz en order_sessions,  │ Multi-país: schedule = hora local + IANA tz        │
│ timezone text en                │ (template). Sesiones = momento absoluto. Evita     │
│ order_schedules                 │ bugs de DST                                        │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Trigger handle_updated_at()     │ DEFAULT now() solo aplica en INSERT; sin trigger,  │
│                                 │ updated_at nunca se actualiza                      │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Trigger handle_new_user +       │ Profile + rol inicial se crean automáticamente; el │
│ handle_user_email_change        │ rol viene del form de registro                     │
│                                 │ (raw_user_meta_data.role). Email se sincroniza en  │
│                                 │ cambios                                            │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Trigger validate_active_role +  │ Doble protección: no se puede setear un            │
│ validate_role_deletion          │ active_role sin el rol, ni borrar un rol que sea   │
│                                 │ el activo                                          │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ ON DELETE RESTRICT en orders →  │ Pedidos son registros financieros; no pueden       │
│ client/service                  │ perder su cliente o servicio. Usar soft-delete     │
│                                 │ (status='archived')                                │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ ON DELETE SET NULL en orders →  │ Un talento puede ser dado de baja; el pedido       │
│ talent                          │ sobrevive para reasignación                        │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Tabla languages + FK en todos   │ Valida locales en DB; previene typos silenciosos   │
│ los locales                     │ en traducciones                                    │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ numeric(10,2) CHECK >= 0 en     │ Previene precisión arbitraria, precios negativos y │
│ precios                         │ valores absurdos                                   │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ currency solo en countries (no  │ Evita inconsistencias; se obtiene via JOIN         │
│ en service_countries)           │                                                    │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ updated_at en tablas mutables   │ Auditar cuándo cambió el estado de un documento,   │
│                                 │ sesión o verificación                              │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ RLS chequea user_roles, nunca   │ active_role es preferencia de UI. Autorización en  │
│ active_role                     │ user_roles                                         │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ ENABLE ROW LEVEL SECURITY en    │ En Supabase RLS está desactivado por defecto; sin  │
│ migración base                  │ activarlo las policies no hacen nada               │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ service_countries usa PK        │ Es la clave natural; un id sintético sería         │
│ compuesta (service_id,          │ redundante                                         │
│ country_id)                     │                                                    │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ UNIQUE (order_id,               │ Idempotencia del cron: evita sesiones duplicadas   │
│ scheduled_start) en             │ si el job corre dos veces                          │
│ order_sessions                  │                                                    │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ CHECK en weekdays y             │ Previene datos inválidos silenciosos (ISO 8601:     │
│ day_of_month                    │ 1=lun, 7=dom; día 1-31)                            │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Dirección en talent_profiles y  │ Matching por proximidad es core del flujo de       │
│ orders                          │ asignación (blueprint). Campos estructurados       │
│                                 │ (address, city_id, postal_code) permiten filtrar   │
│                                 │ por zona                                           │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ countries.timezone IANA         │ Timezone default del país; usado por               │
│                                 │ order_schedules para interpretar horas locales     │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ handle_new_user solo acepta     │ SEGURIDAD: un usuario malicioso podría registrarse  │
│ client y talent (no admin)      │ con role='admin' via signUp options.data. Admin se │
│                                 │ otorga manualmente por un admin existente          │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ ON DELETE SET NULL en campos    │ Un admin/reviewer puede dejar la empresa; su cuenta│
│ de auditoría (approved_by,      │ debe poder eliminarse sin romper el historial. El  │
│ reviewed_by, changed_by)        │ registro histórico sobrevive con NULL              │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Seed data en migración base     │ languages y countries deben existir antes del       │
│ (languages + countries)         │ primer signup; preferred_locale y locale_default   │
│                                 │ tienen FKs que fallarían sin estos datos           │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ schedule_type='once' crea       │ El cron es para recurrencia. One-time no tiene     │
│ sesión inmediata (app, no cron) │ next_session_date; su sesión se crea al confirmar  │
│                                 │ el pedido. El cron los ignora explícitamente       │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ boolean NOT NULL en todas las   │ Sin NOT NULL, un INSERT explícito con NULL se      │
│ columnas boolean                │ acepta. WHERE is_active = true no devuelve filas   │
│                                 │ con NULL — bugs silenciosos en catálogo y cron     │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ languages incluida en RLS       │ Es una tabla pública pero necesita policies;       │
│                                 │ quedó fuera del bloque ALTER TABLE por omisión     │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ created_at en order_schedules   │ Consistencia con el patrón de todas las demás      │
│                                 │ tablas mutables; permite auditar cuándo se         │
│                                 │ programó el schedule                               │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ staff_roles con key inmutable + │ key es el identificador estable en código y RLS.   │
│ display_name editable           │ display_name permite que el admin renombre los     │
│                                 │ roles sin romper nada técnico                      │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ staff_role_scopes tabla         │ Mantiene user_roles limpio; FK compuesta garantiza │
│ separada (no columnas en        │ que scope solo existe cuando el rol existe;        │
│ user_roles)                     │ CHECK (role IN ('manager','viewer')) bloquea scope │
│                                 │ para admin (que tiene acceso global)               │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ permissions text[] arranca      │ Los permisos reales se implementan feature a       │
│ como '{}'                       │ feature en policies RLS. '{}' = sin restricciones  │
│                                 │ definidas aún. Formato: 'resource:action'          │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ permissions como text[] (no     │ Fácil de chequear en RLS:                          │
│ JSONB)                          │ 'orders:write' = ANY(permissions). Extensible sin  │
│                                 │ migración de esquema                               │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Trigger validate_staff_role_    │ Staff (admin/manager/viewer) requiere cuenta       │
│ exclusive en user_roles         │ dedicada; no puede combinarse con client/talent ni │
│                                 │ con otro rol de staff. Bloquea en ambas            │
│                                 │ direcciones en INSERT                              │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Scope country_id NULL + city    │ NULL = sin restricción (accede a todos los         │
│ NULL en staff_role_scopes       │ países/ciudades). Consistente con el patrón NULL=  │
│                                 │ default de service_forms                           │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ admin sin fila en               │ Admin tiene acceso global; forzarle a tener un     │
│ staff_role_scopes               │ scope sería un workaround innecesario. CHECK en    │
│                                 │ staff_role_scopes bloquea inserciones con          │
│                                 │ role='admin'                                       │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Seed de staff_roles en          │ Las filas (admin/manager/viewer) deben existir     │
│ migración base                  │ antes de que user_roles pueda referenciarlas. Sin  │
│                                 │ seed, el primer INSERT de un miembro staff falla   │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Guest via Supabase anonymous    │ signInAnonymously() crea un auth.users con         │
│ auth (no rol explícito)         │ is_anonymous=true. El trigger crea un profile +    │
│                                 │ role='client'. RLS funciona normalmente. El guest   │
│                                 │ puede registrarse después y mantener sus pedidos   │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ profiles.email nullable         │ Usuarios anónimos no tienen email. El email se     │
│                                 │ sincroniza al registrarse (updateUser). Mientras   │
│                                 │ tanto, el contacto está en orders.contact_email    │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Campos contact_* en orders      │ Cada pedido tiene su propio email, nombre y        │
│ (no solo en profiles)           │ teléfono de contacto. Para guests: ÚNICA vía de    │
│                                 │ comunicación. Para clientes registrados: permite   │
│                                 │ contratar para otra persona o usar distinto email  │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Tabla cities con FK (no city    │ Texto libre para ciudades causa problemas de       │
│ text libre)                     │ matching (mayúsculas, acentos, variantes). FK a    │
│                                 │ cities normaliza y permite matching exacto por     │
│                                 │ uuid. Admin gestiona ciudades desde el panel       │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ cities.slug lowercase sin       │ Permite matching humano además de uuid. UNIQUE     │
│ acentos                         │ (country_id, slug) previene duplicados por país    │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Timestamps en categories y      │ Consistencia con el patrón de todas las tablas     │
│ service_required_documents      │ mutables. Permite auditar cuándo se creó/modificó  │
│                                 │ una categoría o requisito documental               │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Trigger validate_city_country_  │ Impide que city_id/service_city_id apunte a una    │
│ match en talent_profiles,       │ ciudad de un país distinto a country_id. Sin esto, │
│ orders y staff_role_scopes      │ datos inconsistentes rompen el matching de          │
│                                 │ proximidad                                         │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Pricing en orders (subtotal,    │ Aunque pagos es feature futuro, el pedido debe     │
│ tax_rate, tax, total, currency) │ capturar precio al crearse. currency es snapshot   │
│                                 │ de countries.currency (inmutable post-creación)     │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ form_id y form_data NOT NULL    │ Toda orden proviene de un formulario. form_id =    │
│ en orders                       │ snapshot de la versión usada. Validación de         │
│                                 │ form_data en app (Zod), no en DB (demasiado frágil │
│                                 │ para JSONB dinámico)                                │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ CHECK status-based en           │ Onboarding multi-step: pending/rejected permiten   │
│ talent_profiles para            │ NULL (perfil incompleto). approved/suspended        │
│ country_id y city_id            │ requieren ambos (necesarios para matching de        │
│                                 │ proximidad)                                        │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Timestamps en todas las tablas  │ Permite auditar cuándo se actualizó una traducción │
│ _translations                   │ (cache invalidation, workflows de traducción)      │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Views _localized con INNER JOIN │ Si una entidad no tiene traducción para un locale, │
│ (no LEFT JOIN)                  │ no aparece. Por diseño: traducción incompleta =     │
│                                 │ en desarrollo, no debe mostrarse en catálogo        │
├─────────────────────────────────┼────────────────────────────────────────────────────┤
│ Índice idx_orders_country       │ RLS de manager/viewer filtra por country_id;        │
│                                 │ admin filtra pedidos por país constantemente.       │
│                                 │ Sin índice, queries lentas en datasets grandes      │
└─────────────────────────────────┴────────────────────────────────────────────────────┘
```

---

## Tablas NO incluidas (features futuros)

- Pagos y facturación (`invoices`, `payment_methods`, `transactions`)
- Valoraciones (`ratings`, `reviews`)
- Disponibilidad del talento (`talent_availability`)
- Notificaciones in-app (`notifications`)
- Logs de email (`email_logs`)
- Geo-matching avanzado con PostGIS (`geography(Point, 4326)`)

---

## Cambios principales respecto a la versión anterior

1. **Reordenamiento de capas** — `languages` → `countries` → `profiles` (resuelve FK circular)
2. **`handle_new_user` lee rol del form de registro** — `raw_user_meta_data->>'role'`, no hardcodea 'client'
3. **`handle_new_user` crea `user_roles`** — usuario no queda bloqueado por trigger `validate_active_role`
4. **Trigger `validate_role_deletion`** — protege contra borrado de rol activo
5. **`ENABLE ROW LEVEL SECURITY`** en todas las tablas
6. **Dirección en `talent_profiles`** — `address`, `city_id`, `postal_code`, `country_id`
7. **Dirección en `orders`** — `service_address`, `service_city_id`, `service_postal_code`
8. **`UNIQUE (order_id, scheduled_start)`** en `order_sessions` — idempotencia del cron
9. **`CHECK` en `weekdays`** — `<@ ARRAY[1,2,3,4,5,6,7]` (ISO 8601)
10. **`CHECK` en `day_of_month`** — `BETWEEN 1 AND 31`
11. **`service_countries` PK compuesta** — eliminado `id` sintético redundante
12. **`countries.timezone`** — timezone IANA por defecto del país
13. **`countries_localized` view** — faltaba
14. **`preferred_locale` referencia `languages(code)`** — validación consistente
15. **`handle_new_user` solo acepta `client`/`talent`** — previene escalación de privilegios via `signUp` options
16. **`ON DELETE SET NULL` en campos de auditoría** — `approved_by`, `reviewed_by`, `changed_by`, `order_sessions.talent_id`
17. **Sección seed data obligatorio** — `languages` + `countries` deben existir antes del primer signup
18. **`schedule_type='once'` documentado** — sesión inmediata al confirmar pedido, no via cron
19. **`boolean NOT NULL` en todas las columnas boolean** — previene lógica de tres valores y bugs silenciosos en queries con `= true/false`
20. **`languages` incluida en RLS** — faltaba en el bloque `ALTER TABLE`
21. **`created_at` en `order_schedules`** — consistencia con el patrón de tablas mutables
22. **Roles `manager` y `viewer`** — añadidos a `profiles.active_role` y `user_roles.role` CHECK
23. **Tabla `staff_roles`** — definiciones de roles de staff con `key` inmutable y `display_name` editable; seed obligatorio en migración base
24. **Tabla `staff_role_scopes`** — ámbito geográfico (país/ciudad) y permisos futuros por asignación de rol manager/viewer; FK compuesta a `user_roles`
25. **Trigger `validate_staff_role_exclusive`** — impide combinar roles staff con client/talent, y staff entre sí; cuentas dedicadas para staff
26. **`user_roles.granted_by`** — auditoría de quién asignó el rol (para staff)
27. **RLS patrón para manager/viewer** — filtrado por scope via JOIN a `staff_role_scopes`
28. **Tabla `cities` + `city_translations`** — normalización de ciudades con FK; reemplaza `city text` en talent_profiles, orders y staff_role_scopes
29. **`profiles.email` nullable** — soporta Supabase anonymous auth (guests sin email hasta que se registren)
30. **Campos `contact_*` en `orders`** — `contact_email`, `contact_name`, `contact_phone`, `contact_address` para contacto explícito por pedido
31. **`categories` + `service_required_documents`** — añadidos `created_at` y `updated_at` con triggers
32. **`staff_roles.created_at`** — añadido por consistencia
33. **Trigger `updated_at` para `staff_roles`, `categories`, `service_required_documents`, `cities`** — faltaban
34. **Seed data `cities`** — ciudades principales de los 6 países iniciales
35. **Numeración corregida en "Orden de creación"** — eliminados duplicados, añadidas tablas `cities`
36. **Trigger `validate_city_country_match`** — impide que `city_id`/`service_city_id` apunte a una ciudad de otro país en `talent_profiles`, `orders` y `staff_role_scopes`
37. **Pricing en `orders`** — `price_subtotal`, `price_tax_rate`, `price_tax`, `price_total`, `currency` (snapshot de `countries.currency` al crear el pedido)
38. **`form_id` y `form_data` NOT NULL en `orders`** — toda orden proviene de un formulario; `form_id` = snapshot de versión; validación en app (Zod)
39. **CHECK status-based en `talent_profiles`** — `country_id` y `city_id` pueden ser NULL solo en `pending`/`rejected` (onboarding multi-step); `approved`/`suspended` los requieren
40. **Timestamps en todas las tablas `_translations`** — `created_at` + `updated_at` con triggers para las 7 tablas de traducciones
41. **Views `_localized` con INNER JOIN intencional** — traducción ausente = entidad no visible para ese locale (por diseño)
42. **Índice `idx_orders_country`** — faltaba; necesario para RLS de manager/viewer y filtros de admin por país
43. **Documentación de estrategia `form_data`** — validación en app, no en DB; `form_id` como audit trail de versión
