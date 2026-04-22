# Feature: Field Catalog (Catálogo de Campos)

## Resumen

Sistema donde los campos de formulario se definen independientemente en la base de datos, agrupados por categoría. Los formularios referencian campos del catálogo por UUID en vez de definirlos inline en JSON. Las respuestas se persisten vinculadas al campo (no al formulario), habilitando reutilización cross-form y persistencia universal de todos los tipos de campo.

**Problema que resuelve**: Los campos no-db_column (text, textarea, etc.) no tienen mecanismo de persistencia — se pierden al guardar. Tampoco hay reutilización entre formularios.

## Requisitos

### Funcionales

1. **Catálogo de campos**: Admin gestiona campos desde `/admin/field-catalog`, agrupados por categoría
2. **Grupos de campos**: Categorías reutilizables (ej: "Registro", "Perfil Talento", "Servicios")
3. **Definición de campo**: Cada campo tiene input_type, persistence_type y persistence_target
4. **Traducciones por campo**: Label, placeholder, description y option_labels traducidos por locale
5. **Referencia por UUID**: FormSchema referencia campos por `field_definition_id` + `required` (per-form)
6. **Persistencia universal**: Cada persistence_type tiene su propia ruta de escritura/lectura
7. **Read path**: Formularios pre-cargan valores existentes del usuario al renderizar
8. **Soft-delete**: Campos se desactivan (`is_active = false`), nunca se eliminan

### No funcionales

- Feature aislado en `features/field-catalog/` (CRUD, actions, components)
- Motor de resolución y persistencia en `shared/lib/field-catalog/`
- Import unidireccional: `features/ → shared/`, datos del catálogo fluyen vía props (callback injection)
- Formularios existentes se recrean manualmente (no backward compat)

## Esquema DB

### Grupos de campos

```sql
CREATE TABLE form_field_groups (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE form_field_group_translations (
  group_id uuid NOT NULL REFERENCES form_field_groups(id) ON DELETE CASCADE,
  locale   text NOT NULL,
  name     text NOT NULL,
  PRIMARY KEY (group_id, locale)
);
```

### Definiciones de campos

```sql
CREATE TABLE form_field_definitions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id           uuid NOT NULL REFERENCES form_field_groups(id),
  key                text NOT NULL UNIQUE,
  input_type         text NOT NULL,
  persistence_type   text NOT NULL,
  persistence_target jsonb,
  options            jsonb,
  options_source     text,
  sort_order         int NOT NULL DEFAULT 0,
  is_active          boolean NOT NULL DEFAULT true,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

CREATE TABLE form_field_definition_translations (
  field_id      uuid NOT NULL REFERENCES form_field_definitions(id) ON DELETE CASCADE,
  locale        text NOT NULL,
  label         text NOT NULL,
  placeholder   text,
  description   text,
  option_labels jsonb,
  PRIMARY KEY (field_id, locale)
);
```

### Respuestas de usuario

```sql
CREATE TABLE user_form_responses (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  field_definition_id uuid NOT NULL REFERENCES form_field_definitions(id),
  value               jsonb,
  updated_at          timestamptz DEFAULT now(),
  created_at          timestamptz DEFAULT now(),
  UNIQUE (user_id, field_definition_id)
);
CREATE INDEX idx_ufr_user ON user_form_responses(user_id);
CREATE INDEX idx_ufr_field ON user_form_responses(field_definition_id);
```

## persistence_type por tipo

| persistence_type | persistence_target | Write | Read |
|---|---|---|---|
| `db_column` | `{"table":"profiles","column":"phone"}` | UPDATE tabla | SELECT tabla |
| `auth` | `{"auth_field":"email"}` | signUp | Never (no pre-fill passwords) |
| `form_response` | `null` | UPSERT user_form_responses | SELECT user_form_responses |
| `survey` | `{"survey_question_key":"q"}` | UPSERT survey_responses | SELECT survey_responses |
| `service_select` | `null` | UPSERT talent_services | SELECT talent_services |
| `subtype` | `{"subtype_group":"slug"}` | UPSERT talent_service_subtypes | SELECT talent_service_subtypes |

## input_type (para rendering)

`text`, `email`, `password`, `number`, `date`, `boolean`, `textarea`, `single_select`, `multiselect`

## Nuevo FormSchema

```typescript
type CatalogFieldRef = {
  field_definition_id: string;
  required: boolean;
};

type CatalogFormStep = {
  key: string;
  field_refs: CatalogFieldRef[];
  actions?: StepAction[];
};

type CatalogFormSchema = {
  steps: CatalogFormStep[];
};
```

## Modelo de traducciones

| Qué | Dónde |
|---|---|
| Labels de campos | `form_field_definition_translations` (per-campo, del catálogo) |
| Labels de steps | `registration_form_translations.labels[step_key]` (per-form, tabla existente) |
| Labels de actions | `registration_form_translations.labels[action_key]` (per-form, tabla existente) |

## Cascade simplificado (General → Variante)

General define base de `field_refs`. Variante hereda y puede:
- Añadir field_refs (campo específico para ese país/ciudad)
- Quitar field_refs (campo no aplica en ese contexto)
- Overridear `required` (campo obligatorio solo en ciertas variantes)

## Arquitectura

### Feature structure

```
features/field-catalog/
├── actions/
│   ├── list-field-catalog.ts
│   ├── save-field-group.ts
│   ├── save-field-definition.ts
│   └── toggle-field-active.ts
├── components/
│   ├── field-catalog-manager.tsx
│   ├── field-group-card.tsx
│   └── field-definition-editor.tsx
└── schemas.ts

shared/lib/field-catalog/
├── types.ts
├── schema-types.ts
├── resolved-types.ts
├── resolve-form.ts
├── load-form-values.ts
├── persist-form-data.ts
├── cascade-field-refs.ts
├── catalog-schema-validation.ts
├── persistence/
│   ├── db-column.ts
│   ├── auth.ts
│   ├── form-response.ts
│   ├── survey.ts
│   ├── service-select.ts
│   └── subtype.ts
└── __tests__/
```

## Criterios de aceptación

- [ ] Admin puede crear/editar grupos y campos en `/admin/field-catalog`
- [ ] Campos tienen persistence_type validado con Zod discriminated union
- [ ] FormSchema usa CatalogFieldRef[] en vez de FormField[] inline
- [ ] resolveForm() carga campo + traducción + valor previo → ResolvedField
- [ ] persistFormData() escribe cada campo según su persistence_type
- [ ] Fallback i18n 3 niveles: locale → país default → 'es'
- [ ] Validación server-side de required antes de persistir
- [ ] save-form valida que todos los UUIDs existen en form_field_definitions
- [ ] Cascade General → Variante funciona con add/remove/requireOverride
- [ ] Registration + talent_service flows usan el nuevo motor
- [ ] Build pasa: `NODE_ENV=production pnpm build`
- [ ] Tests escritos y pasando
