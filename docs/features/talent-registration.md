# Talent registration form

Form público que crea un talento (auth user + profile + talent_profile + talent_services), envía email de confirmación informacional, y redirige al onboarding.

## Goal

Que un nuevo talento se registre desde una página pública (`/[locale]/registro/talento`) llenando un formulario único, y que al submit:

1. Se cree el usuario en Supabase Auth.
2. Se popule `profiles` con datos personales.
3. Se cree `talent_profiles` con status `pending`, identificador fiscal, consents.
4. Se creen N rows en `talent_services` (uno por cada servicio que ofrece).
5. Se envíe un email informacional de confirmación (no bloquea entrada).
6. Se redirija a `/[locale]/portal/onboarding` (onboarding fuera de scope; placeholder por ahora).

El form es estático en TSX. Admin gestiona traducciones y activación por país/ciudad desde DB (Phase B con UI dedicado).

## Out of scope (Phase B y posteriores)

- Admin UI `/admin/forms` y `/admin/fiscal-id-types` (Phase B y C).
- Onboarding flow (otro plan).
- Otros 3 forms: `client_registration`, `service_hire`, `service_offer`.

## Shape de datos (DB → form → submit)

### Tablas afectadas en este plan

- **`fiscal_id_types`** (nueva)
  - `id uuid PK`
  - `code text UNIQUE` (NIF, NIE, CUIT, CUIL, etc.)
  - `is_active boolean`
  - `sort_order int`
  - `i18n jsonb` — `{ "es": { "label", "help?" }, "en": {...}, ... }`
  - timestamps

- **`fiscal_id_type_countries`** (nueva, junction)
  - `fiscal_id_type_id uuid FK`
  - `country_id uuid FK`
  - PK compuesta `(fiscal_id_type_id, country_id)`

- **`talent_profiles`** (alteración)
  - Agregar: `fiscal_id_type_id uuid FK fiscal_id_types(id) NULL`
  - Agregar: `fiscal_id text NULL`
  - Agregar: `marketing_consent boolean NOT NULL DEFAULT false`
  - Agregar: `additional_info text NULL`

- **`profiles`** (alteración)
  - Drop columna `nif` (datos migrados a `talent_profiles.fiscal_id`)

- **`form_definition_countries`** (nueva)
  - `form_id uuid FK`, `country_id uuid FK`, `is_active boolean`
  - PK compuesta. Tabla de **activación**, NO de traducción.

- **`form_definition_cities`** (nueva)
  - `form_id uuid FK`, `city_id uuid FK`, `is_active boolean`
  - PK compuesta. Activación opcional a nivel ciudad.

### Tablas que ya existen y se escriben durante el submit

- `auth.users` — creado por `supabase.auth.signUp`
- `profiles` — `handle_new_user` trigger crea la row al signUp; el action la actualiza con full_name, phone, address jsonb, preferred_country, preferred_city, preferred_locale, active_role='talent'
- `talent_profiles` — INSERT con status='pending', country_id, city_id, fiscal_id_type_id, fiscal_id, terms_accepted, marketing_consent, additional_info
- `talent_services` — INSERT N rows (talent_id, service_id, country_id, is_verified=false)

### form_definitions['talent_registration']

- `schema jsonb` — lista de field keys (admin lee para saber qué traducir):
  ```json
  { "fields": [
    { "key": "full_name", "type": "text", "required": true },
    { "key": "email", "type": "email", "required": true },
    { "key": "password", "type": "password", "required": true },
    { "key": "phone", "type": "tel", "required": true },
    { "key": "country_id", "type": "select", "required": true },
    { "key": "city_id", "type": "select", "required": true },
    { "key": "address", "type": "address", "required": true },
    { "key": "fiscal_id_type_id", "type": "select", "required": true },
    { "key": "fiscal_id", "type": "text", "required": true },
    { "key": "services", "type": "multiselect", "required": true },
    { "key": "additional_info", "type": "textarea", "required": false },
    { "key": "disclaimer", "type": "display", "required": false },
    { "key": "terms_accepted", "type": "checkbox", "required": true },
    { "key": "marketing_consent", "type": "checkbox", "required": false }
  ] }
  ```

- `i18n jsonb` — labels/placeholders/help/errors por locale. Shape:
  ```json
  { "es": {
    "title": "Registro de talento",
    "submitLabel": "Registrarme",
    "fields": {
      "full_name": { "label": "...", "placeholder": "...", "errors": { "required": "..." } },
      ...
      "disclaimer": { "content": "<texto legal extenso>" }
    }
  } }
  ```

  Phase B llenará en/pt/fr/ca via admin UI. Mientras tanto el helper `localize()` hace fallback a `'es'`.

## Form fields (orden de render)

| # | Key | Component | DB target | Validación clave |
|---|-----|-----------|-----------|------------------|
| 1 | `full_name` | text input | `profiles.full_name` | min 2, max 200 |
| 2 | `email` | email input | `auth.users.email` | RFC email |
| 3 | `password` | password input | `auth.users.password` (hashed) | min 8 |
| 4 | `phone` | PhoneInput shared (libphonenumber-js) | `profiles.phone` | E.164 válido |
| 5 | `country_id` | Select de countries activos en form | `profiles.preferred_country` + `talent_profiles.country_id` | uuid FK |
| 6 | `city_id` | Select de cities filtradas por country_id | `profiles.preferred_city` + `talent_profiles.city_id` | uuid FK |
| 7 | `address` | AddressAutocomplete shared (Mapbox) | `profiles.address` jsonb (`{street, postal_code, lat, lng, mapbox_id, raw_text}`) | objeto con street + postal_code mínimos |
| 8 | `fiscal_id_type_id` | Select de fiscal_id_types asociados al country | `talent_profiles.fiscal_id_type_id` | uuid FK |
| 9 | `fiscal_id` | text input | `talent_profiles.fiscal_id` | min 4, max 50 |
| 10 | `services` | MultiSelect de services activos en country (+ city) | `talent_services` (N inserts) | array uuid[] min 1 |
| 11 | `additional_info` | textarea | `talent_profiles.additional_info` | max 2000 (opcional) |
| 12 | `disclaimer` | display-only | — | — |
| 13 | `terms_accepted` | checkbox required | `talent_profiles.terms_accepted` | === true |
| 14 | `marketing_consent` | checkbox optional | `talent_profiles.marketing_consent` | bool |

## Contratos de Server Actions

### `getFormContext(locale: string): Promise<TalentRegistrationContext>`

Llamado en SSR desde la page para hidratar el form.

**Retorna:**
```ts
{
  formDefinition: {
    schema: FormSchema,
    i18n: FormI18n,
  },
  countries: { id, code, name }[],            // countries activos en form_definition_countries para 'talent_registration'
  fiscalIdTypes: {
    id, code, label,
    countryIds: string[],                     // qué countries permiten este tipo
  }[],
  // cities y services se cargan client-side via getServicesByLocation cuando se selecciona country/city
}
```

### `getServicesByLocation(countryId: string, cityId?: string): Promise<ServiceOption[]>`

Client-side cuando el user cambia country/city.

**Retorna:**
```ts
{ id: string, slug: string, name: string }[]  // services activos en country_id (+ city_id si se da)
```

### `registerTalent(input: TalentRegistrationInput): Promise<RegisterResult>`

Form submit. Crea todo + redirect.

**Input:** `TalentRegistrationInput` (validado por `TalentRegistrationSchema` Zod)

**Retorna:** redirect via Next.js `redirect()` o `{ error: { fieldKey: [errorCode] } }` si falla.

**Pasos:**
1. Validar Zod
2. `auth.signUp({ email, password, options: { data: { full_name }, emailRedirectTo } })`
3. Si auth falla con email duplicado → return `{ error: { email: ['duplicateEmail'] } }`
4. UPDATE profiles con datos personales
5. INSERT talent_profiles
6. INSERT talent_services (N rows)
7. `auth.resend({ type: 'signup', email })` (informacional)
8. `redirect('/${locale}/portal/onboarding')`

## Casos de error

- **Email duplicado:** mostrar error en el campo email, no avanzar.
- **Mapbox falla:** permitir submit con address que sólo tiene `raw_text` (degradación graceful).
- **Sin services en country/city:** disabled submit + warning ("No hay servicios disponibles en esta zona").
- **fiscal_id_type_id sin opciones para el country seleccionado:** disabled fiscal field + warning con texto del i18n.
- **Submit con campos faltantes:** los muestra el resolver Zod, mensajes desde `form_definitions.i18n[locale].fields[key].errors[...]` con fallback a string genérico.

## Criterios de aceptación

- [ ] Page `/es/registro/talento` renderiza el form con labels en español
- [ ] Cambiar country dropdown filtra cities y fiscal_id_types
- [ ] Cambiar city filtra services
- [ ] Mapbox autocomplete funciona con token válido
- [ ] Submit con datos válidos crea: 1 auth.users + 1 profiles updated + 1 talent_profiles + N talent_services
- [ ] Submit redirige a `/es/portal/onboarding` (placeholder)
- [ ] Email de confirmación llega al inbox
- [ ] Submit con email duplicado muestra error en campo email
- [ ] Submit con campos faltantes muestra errores localizados
- [ ] `/en/registro/talento` y `/pt/registro/talento` cargan (con strings ES por fallback)
- [ ] Cero strings hardcodeados visibles en la UI (todos via i18n)
- [ ] `pnpm lint`, `tsc --noEmit`, `pnpm test`, `NODE_ENV=production pnpm build` verdes
- [ ] Cada archivo < 300 LOC, cada función < 60 LOC
- [ ] Feature total < 1500 LOC

## Patrón "un archivo por field" (para devs futuros)

**Añadir un field nuevo (e.g., `linkedin_url`):**

1. Crear `src/features/talent-registration/fields/linkedin-url.tsx`:
   ```tsx
   export const linkedinUrlSchema = z.string().url().optional();
   export function LinkedinUrlInput(props: FieldProps<string>) { ... }
   ```
2. Agregar a `fields.ts` (registry + orden).
3. Agregar a `schemas.ts`: `linkedin_url: linkedinUrlSchema`.
4. Decidir mapping DB:
   - Columna nueva en `talent_profiles` → migration en S(N)+1
   - O en `talent_profiles.data` jsonb (si existe en el futuro)
5. Agregar el write en `actions/register.ts` (paso correspondiente).
6. Actualizar `form_definitions['talent_registration'].schema.fields` (UPDATE SQL) para que admin pueda traducir el field nuevo en Phase B.

**Quitar un field:** operación inversa (4-5 archivos coordinados).

## Estructura de archivos

```
src/features/talent-registration/
├── fields/
│   ├── full-name.tsx
│   ├── email.tsx
│   ├── password.tsx
│   ├── phone.tsx
│   ├── country-city.tsx
│   ├── address.tsx
│   ├── fiscal-id.tsx
│   ├── services.tsx
│   ├── additional-info.tsx
│   ├── disclaimer.tsx
│   ├── terms-accepted.tsx
│   └── marketing-consent.tsx
├── fields.ts          # registry + orden
├── schemas.ts         # Zod compuesto
├── types.ts           # Input/Context types
├── actions/
│   ├── get-form-context.ts
│   ├── get-services-by-location.ts
│   └── register.ts
├── components/
│   └── talent-registration-form.tsx  # orchestrator (Client)
├── __tests__/
│   ├── schemas.test.ts
│   ├── register.test.ts
│   └── form.test.tsx
└── index.ts
```

## Dependencias nuevas

- `libphonenumber-js` (validación + country code dropdown)
- `@mapbox/search-js-react` (autocomplete oficial)
- `react-hook-form` + `@hookform/resolvers` (manejo de form state)
