# Feature: Formularios de Talento (talent-services)

## Resumen

Sistema de formularios dinámicos para talentos, paralelo al sistema de formularios de servicio (cliente). Cuando un talento se registra para ofrecer un servicio, completa un formulario específico definido por el admin. La lógica de cascade es idéntica a `features/forms/`: General + variantes por ciudad.

## Requisitos

### Funcionales

1. **Formulario por servicio**: Cada servicio tiene un formulario de talento (separado del formulario del cliente)
2. **Variantes por ciudad**: Igual que service_forms — General + variantes por ciudad con cascade
3. **Traducciones**: Labels, placeholders, opciones por locale (es, pt, en, fr, ca)
4. **Creación manual**: El admin crea talent forms desde `/admin/talent-services/`
5. **Activación/desactivación**: El admin puede activar o desactivar un formulario
6. **Respuestas**: Se guardan en `talent_services.form_data` (JSONB) + `form_id` (snapshot)
7. **Campo sub-tipo**: Field type "subtype" que carga opciones de `service_subtypes` — **pendiente de implementar**

### No funcionales

- Feature aislado en `features/talent-services/`
- NO importa de `features/forms/` (cada feature tiene sus propios componentes)
- Cada archivo < 300 LOC, feature total < 1500 LOC

> **Auto-creación al publicar servicio: pendiente.** La spec original decía auto-crear un talent_form vacío al publicar un servicio. Esto NO está implementado: no existe trigger ni acción en `update-service.ts` para ello. La creación es manual desde `/admin/talent-services/`.

## Esquema DB

### talent_forms

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
```

### talent_form_translations

```sql
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

### Columnas en talent_services (pendiente de migración)

Las siguientes columnas están especificadas pero **aún no se han ejecutado en la DB**:

```sql
-- PENDIENTE: ejecutar este ALTER TABLE
ALTER TABLE talent_services ADD COLUMN form_data jsonb;
ALTER TABLE talent_services ADD COLUMN form_id uuid
  REFERENCES talent_forms(id) ON DELETE SET NULL;
```

Las tablas `talent_forms` y `talent_form_translations` SÍ existen en la DB. Los campos `form_data` y `form_id` en `talent_services` aún no.

## Arquitectura

### Feature structure

```
features/talent-services/
├── index.ts
├── components/
│   ├── talent-service-builder.tsx    — Form builder para talent forms (usa misma lógica que FormBuilder)
│   ├── talent-service-renderer.tsx   — Renderizado del formulario en el portal del talento
│   └── talent-service-config.tsx     — Configuración del talent form (activar/desactivar, metadata)
├── actions/
│   ├── get-talent-form.ts            — Carga talent form + traducciones
│   ├── save-talent-form.ts           — Guarda schema y traducciones
│   ├── list-talent-form-variants.ts  — Lista variantes activas con metadata ciudad/país
│   ├── clone-talent-form-variant.ts  — Clona schema + traducciones de ciudad origen a destino
│   ├── cascade-talent-general-save.ts— Guarda General + propaga cascade a todas las variantes
│   ├── get-talent-service-form.ts    — Portal talento: carga el form correcto para un servicio
│   ├── list-talent-services.ts       — Lista admin de servicios con talent forms
│   ├── create-talent-service.ts      — Crea un talent form vacío para un servicio
│   ├── save-talent-form-activation.ts— Toggle activo/inactivo de un talent form
│   └── submit-talent-service.ts      — Submit del formulario desde el portal del talento
└── __tests__/
```

### Admin UI

- Lista: `/admin/talent-services/` — tabla con servicio, estado, variantes
- Editor: `/admin/talent-services/[id]/` — 2 tabs: Configuración + Formulario
- Creación manual desde la lista (no auto-creación al publicar servicio)

**Distinción crítica (igual que `features/forms/`):** el componente `TalentServiceBuilder` llama a `cascadeTalentGeneralSave` si `cityId === null` y a `saveTalentFormWithTranslations` si `cityId !== null`.

## Cascade behavior

| Acción | Resultado |
|---|---|
| DELETE service | CASCADE → talent_forms borrados |
| DELETE talent_form | SET NULL → talent_services.form_id (form_data preservado) |

## Criterios de aceptación

- [ ] Admin puede ver lista de talent forms filtrada por servicio
- [ ] Admin puede crear/editar talent form con pasos y campos
- [ ] Variantes por ciudad funcionan con cascade (General → ciudades)
- [ ] Traducciones por locale funcionan
- [ ] Admin puede activar/desactivar talent forms
- [ ] Talento puede completar el formulario desde su portal (portal renderer)
- [ ] Respuestas se guardan en talent_services.form_data (tras ejecutar ALTER TABLE)
- [ ] Sub-tipos seleccionados se guardan en talent_service_subtypes
- [ ] Build pasa: `NODE_ENV=production pnpm build`
- [ ] Tests escritos y pasando
- [ ] Auto-creación al publicar: pendiente de implementar
- [ ] Field type "subtype": pendiente de implementar
