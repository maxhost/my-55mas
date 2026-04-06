# Feature: Campo tipo `db_column` — Mapeo dinámico formulario → DB

## Propósito

Nuevo tipo de campo en el form builder que permite al admin mapear campos de formularios dinámicos directamente a columnas de tablas en la base de datos. Elimina el guessing hardcodeado en server actions (ej: `form_data['full_name'] ?? form_data['nombre']`) y permite configuración explícita.

## Patrón

Sigue el patrón existente de `survey` (tiene `survey_question_key`) y `subtype` (tiene `subtype_group`):

1. Admin selecciona tipo "Campo de base de datos" en el form builder
2. Dropdown 1: selecciona tabla (ej: "Perfil del talento")
3. Dropdown 2: selecciona columna (ej: "Fecha de nacimiento")
4. El renderer infiere el tipo de input (date picker, checkbox, select, etc.) del tipo de la columna
5. Al submit, `extractMappedFields()` extrae valores y los escribe a columnas tipadas

## Schema

```typescript
// Nuevo en FormField
type FormField = {
  key: string;
  type: FieldType;          // incluye 'db_column'
  required: boolean;
  options?: string[];        // auto-poblado del registry para columnas con select
  subtype_group?: string;
  survey_question_key?: string;
  db_table?: string;         // NUEVO: tabla destino (solo si type === 'db_column')
  db_column?: string;        // NUEVO: columna destino (solo si type === 'db_column')
};
```

## Registry estático

Constante tipada en `shared/lib/forms/db-column-registry.ts`. Define qué tablas y columnas están disponibles para mapeo. No viene de la DB.

### Tablas incluidas (v1)

| Tabla | Contextos (allowedTables) | Tipo |
|---|---|---|
| `profiles` | Registration forms, Talent service forms | DB real |
| `talent_profiles` | Registration forms, Talent service forms | DB real |
| `orders` | Service forms (contratación futura) | DB real |
| `auth` | Registration forms | Virtual (Supabase Auth) |

### Columnas incluidas (v1)

**profiles:** full_name (text), phone (text), nif (text), preferred_contact (select: email/phone/whatsapp)

**talent_profiles:** birth_date (date), gender (select: male/female/other/prefer_not_to_say), address (text), postal_code (text), has_car (boolean), preferred_payment (select: bank_transfer/cash/paypal), professional_status (select: employed/retired/freelance/unemployed)

**orders:** contact_name (text), contact_email (email), contact_phone (text), contact_address (text), service_address (text), notes (textarea)

**auth (virtual):** email (email → supabase.auth.signUp), password (password → supabase.auth.signUp), confirm_password (password → validación server-side, nunca persistido)

### Tabla auth — Detalles

`auth` es una tabla virtual que no existe en la base de datos. Sus columnas representan campos de autenticación que se procesan en `register-user.ts`:

- `auth.email` → Se usa como email para `supabase.auth.signUp()` y se escribe a `profiles.email`
- `auth.password` → Se usa como password para `supabase.auth.signUp()`. Nunca se persiste en form_data ni en ninguna tabla
- `auth.confirm_password` → Se valida server-side que coincide con `auth.password`. Nunca se persiste

Los campos auth se stripean de `form_data` antes de persistir (filtro por `db_table === 'auth'`). El tipo `password` como field type standalone se oculta del picker; el tipo `email` queda como input email genérico (para contacto, etc.) sin relación con auth.

### Exclusiones v1

- **FKs (city_id, country_id):** Necesitan datos dinámicos (lista de ciudades/países). Diferido a v2.
- **Columnas de sistema:** id, created_at, updated_at, status — gestionadas internamente.

## Rendering

El renderer consulta el registry por `field.db_table` + `field.db_column` y renderiza según `inputType`:

| inputType | Input renderizado |
|---|---|
| `text` | `<Input type="text" />` |
| `email` | `<Input type="email" />` |
| `date` | `<Input type="date" />` |
| `number` | `<Input type="number" />` |
| `boolean` | `<input type="checkbox" />` |
| `select` | `<select>` con opciones del registry + option_labels de translations |
| `textarea` | `<Textarea />` |

**Fallback:** Si el registry lookup falla (columna removida), renderiza input text. No crash.

## Extracción de datos (submit)

```typescript
// shared/lib/forms/extract-mapped-fields.ts
function extractMappedFields(schema: FormSchema, formData: Record<string, unknown>)
  → { [tableName: string]: Record<string, unknown>, unmapped: Record<string, unknown> }
```

- `form_data` sigue guardando TODO (auditoría completa)
- Los campos mapeados se COPIAN a columnas tipadas adicionalmente
- Campos sin mapping van al resultado `unmapped`

## Decisiones de diseño

1. **email/password NO son db_column** — Son tipos especiales para Supabase Auth
2. **form_data guarda todo** — Mapped + unmapped, como snapshot completo
3. **Opciones de select auto-pobladas** — Del registry, read-only en builder. Labels editables por locale
4. **Validación de unicidad** — Zod rechaza dos campos mapeando a la misma table.column
5. **Sin bloqueo visual de duplicados (v1)** — Solo validación en Zod al guardar
6. **allowedTables por contexto** — Cada feature wrapper pasa las tablas relevantes

## Builder UX

- Tipo "Campo de base de datos" aparece en FieldTypePicker
- Al seleccionarlo, aparece `DbColumnFieldConfig` con 2 dropdowns
- Solo tablas incluidas en `allowedTables` (filtrado por contexto del formulario)
- Si la columna tiene opciones (select), muestra inputs de traducción de opciones
- Admin configura label, placeholder, required como cualquier otro campo
- Key del campo es auto-generada (ej: `step_1_field_3`), no derivada de la columna

## Cascade

`db_table` y `db_column` son propiedades del FormField. `structuredClone()` en cascade-helpers las copia. Sin cambio necesario en la lógica de cascade.

## Criterios de aceptación

- [x] Tipo `db_column` disponible en FieldTypePicker
- [x] Admin puede seleccionar tabla y columna con 2 dropdowns
- [x] Solo tablas relevantes al contexto aparecen (allowedTables)
- [x] Columnas con opciones muestran inputs de traducción
- [x] Renderer renderiza input correcto según inputType de la columna
- [x] Fallback a text input si columna no existe en registry
- [x] extractMappedFields extrae valores por tabla correctamente
- [x] register-user.ts usa extractMappedFields (no guessing)
- [x] submit-talent-service.ts extrae y escribe a talent_profiles
- [x] Zod valida: db_table+db_column requeridos si type=db_column
- [x] Zod valida: tabla y columna deben existir en registry
- [x] Zod valida: no duplicados de table.column por formulario
- [x] Cascade preserva db_table y db_column en variantes
- [x] Formularios existentes sin db_column siguen funcionando
- [x] form-renderer.tsx ≤ 300 líneas (split previo) — 196 líneas
- [x] Todos los archivos nuevos ≤ 150 líneas
- [x] Tests escritos y pasando (TDD) — 120 tests
- [x] Build pasa: `NODE_ENV=production pnpm build`
- [x] Typecheck limpio: `npx tsc --noEmit`
- [x] i18n en 5 locales: es, en, pt, fr, ca
