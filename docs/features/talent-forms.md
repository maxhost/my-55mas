# Feature: Formularios de Talento

## Resumen

Sistema de formularios dinámicos para talentos, paralelo al sistema existente de formularios de servicio (cliente). Cuando un talento se registra para ofrecer un servicio, completa un formulario específico definido por el admin.

## Requisitos

### Funcionales

1. **Formulario por servicio**: Cada servicio tiene un formulario de talento (separado del formulario del cliente)
2. **Variantes por ciudad**: Misma lógica que service_forms — General + variantes por ciudad con cascade
3. **Traducciones**: Labels, placeholders, opciones por locale (es, pt, en, fr, ca)
4. **Auto-creación**: Al publicar un servicio, se crea automáticamente un talent_form vacío
5. **Creación manual**: El admin puede crear talent forms desde el panel
6. **Campo sub-tipo**: Nuevo field type "subtype" que carga opciones de `service_subtypes`
7. **Respuestas**: Se guardan en `talent_services.form_data` (JSONB) + `form_id` (snapshot)

### No funcionales

- Reutilizar componentes del form builder existente (movidos a `shared/`)
- Aislar features: `features/talent-forms/` NO importa de `features/forms/`
- Cada archivo < 300 LOC, feature total < 1500 LOC

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

### Cambios en talent_services

```sql
ALTER TABLE talent_services ADD COLUMN form_data jsonb;
ALTER TABLE talent_services ADD COLUMN form_id uuid
  REFERENCES talent_forms(id) ON DELETE SET NULL;
```

## Arquitectura

### Componentes compartidos (shared/)

Los componentes del form builder se mueven de `features/forms/components/` a `shared/components/form-builder/` usando **callback injection** — reciben server actions como props:

```
shared/components/form-builder/
├── form-builder.tsx, form-builder-panel.tsx, step-card.tsx,
├── field-editor.tsx, field-type-picker.tsx, field-options-editor.tsx,
├── variant-selector.tsx, subtype-field-config.tsx

shared/lib/forms/
├── types.ts, schemas.ts, utils.ts, cascade-helpers.ts
```

### Feature talent-forms

```
features/talent-forms/
├── index.ts
├── components/
│   └── talent-form-builder.tsx    ← wrapper con talent actions
├── actions/
│   ├── get-talent-form.ts
│   ├── save-talent-form.ts
│   ├── list-talent-form-variants.ts
│   ├── clone-talent-form-variant.ts
│   └── cascade-talent-general-save.ts
└── __tests__/
```

### Admin UI

- Lista: `/admin/talent-forms/` — tabla con servicio, estado, variantes
- Editor: `/admin/talent-forms/[id]/` — 2 tabs: Configuración + Formulario
- Auto-creación orquestada desde `services/[id]/page.tsx`

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
- [ ] Al publicar servicio, se auto-crea talent form vacío
- [ ] Campo tipo "subtype" muestra opciones de service_subtypes
- [ ] Talento puede completar el formulario desde su portal
- [ ] Respuestas se guardan en talent_services.form_data
- [ ] Sub-tipos seleccionados se guardan en talent_service_subtypes
- [ ] Build pasa: `NODE_ENV=production pnpm build`
- [ ] Tests escritos y pasando
