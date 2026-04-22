# Field Catalog — Runbook S7/S8 (integración manual)

> Actualizado 2026-04-21 tras completar S1–S6b. Este documento reemplaza al handoff previo.

## Estado del código

Pipeline completo commiteado en `main`:

| S | Commit | Qué |
|---|---|---|
| S1 | `5b6c3de` | Migración aplicada + tipos DB regenerados |
| S2 | `979fbd7` | Zod validation (discriminated union) |
| S3 | `64d4cb4` | 6 adapters + dispatchers |
| S4 | `907ee57` | resolve-form orchestrator |
| S5a | `641224c` | 5 server actions backend |
| S5b | `acfbb1e` | `/admin/field-catalog` + nav + i18n 5 locales |
| S6a | `c559b7f` | Renderer refactorizado a ResolvedField |
| S6b | `f7a5fe2` | Callers al pipeline ResolvedForm + persistFormData |

Smoke check realizado: `/es/admin/field-catalog`, `/es/admin`, `/es/admin/spoken-languages`, `/es/admin/test-talent-form`, `/es/admin/forms` → todas 200 en dev server. 388/388 tests verdes, `NODE_ENV=production pnpm build` OK.

## Formularios actuales en DB (dev `vkfolbfchkwezrbkxpiv`)

| slug | target_role | steps | ID |
|---|---|---|---|
| `formulario-general` | talent | 1 | `617eb9f1-…-c46d` |
| `formulario-registro-cliente` | client | 2 | `9022e29e-…-3b6c` |
| `registro-talento` | talent | 3 | `c7a8ace3-…-87f4` |

Todos tienen schema legacy (`steps[].fields[]` inline). `resolveFormFromJson` los valida con Zod y al fallar retorna `{ steps: [] }` → la página carga pero el form se ve vacío hasta recreación.

## S7 — Integración registration end-to-end

### Paso 1: crear fields en `/admin/field-catalog`

`pnpm dev` y navegar a `/es/admin/field-catalog`. Crear un grupo y estos 3 fields para cubrir el flujo de `registro-talento` (step 1):

**Grupo**: slug `registration`, traducciones mínimas (al menos `es`: "Registro").

**Fields**:

1. **full_name**
   - key: `full_name`
   - input_type: `text`
   - persistence_type: `db_column`
   - table: `profiles` / column: `full_name`
   - translations es: label="Nombre completo"

2. **email**
   - key: `auth_email`
   - input_type: `email`
   - persistence_type: `auth`
   - auth_field: `email`
   - translations es: label="Email"

3. **password**
   - key: `auth_password`
   - input_type: `password`
   - persistence_type: `auth`
   - auth_field: `password`
   - translations es: label="Contraseña"

Anotar los 3 UUIDs que devuelve el admin (aparecen en la URL al editar o en la DB con `SELECT id, key FROM form_field_definitions;`).

### Paso 2: pegar CatalogFormSchema en `registration_forms.schema`

Via SQL (reemplazar `<UUID_*>` con los IDs del paso 1):

```sql
UPDATE registration_forms
SET schema = '{
  "steps": [
    {
      "key": "step_1",
      "field_refs": [
        {"field_definition_id": "<UUID_FULL_NAME>", "required": true},
        {"field_definition_id": "<UUID_EMAIL>", "required": true},
        {"field_definition_id": "<UUID_PASSWORD>", "required": true}
      ],
      "actions": [
        {"key": "btn_register", "type": "register"}
      ]
    }
  ]
}'::jsonb
WHERE slug = 'registro-talento' AND city_id IS NULL;
```

### Paso 3: testeo browser

1. `/es/admin/test-talent-form` → seleccionar `registro-talento`, un país y una ciudad
2. El form debería renderizar los 3 fields con labels en español
3. Completar y submit (action type='register' dispara `registerUser`)
4. Verificar en DB:
   - `auth.users` tiene el nuevo usuario
   - `profiles.full_name` tiene el valor
   - `talent_profiles` tiene un row con `status='pending'`

### Paso 4: verificar soft-delete warning

1. En `/admin/field-catalog` desactivar el field "full_name" (botón power en la fila)
2. Debería aparecer toast: "Este campo se usa en 1 formulario."
3. Re-activar para no dejar roto el form.

## S8 — Integración talent_service end-to-end

### Paso 1: crear fields adicionales en el catálogo

Fields de perfil talent (grupo "talent-service" o similar):

1. **phone** → db_column profiles.phone, input=text
2. **address** → db_column talent_profiles.address, input=text
3. **has_car** → db_column talent_profiles.has_car, input=boolean
4. **preferred_payment** → db_column talent_profiles.preferred_payment, input=single_select, options: `bank_transfer, cash, paypal`

### Paso 2: editar un `talent_forms.schema`

```sql
SELECT id, service_id, city_id FROM talent_forms LIMIT 3;
```

Pegar schema con `field_refs` usando los UUIDs de los fields creados.

### Paso 3: testeo browser

1. Logearse como talent (el que creó S7)
2. Navegar a `/es/portal/services/<serviceId>`
3. Ver el formulario renderizado con los fields del catálogo
4. Completar y guardar
5. Verificar en DB:
   - `talent_services` tiene el row con `form_id`
   - `talent_profiles.address`, `has_car`, `preferred_payment` actualizados
   - Si hay `subtype` field: `talent_service_subtypes` tiene los rows

## Gotchas que ya resolvimos — no olvidar

- **Schemas legacy no crashean**: `resolveFormFromJson` retorna `{steps:[]}` si Zod falla, la page carga pero muestra form vacío.
- **service_select adapter requiere `country_id`**: actions lo pasan vía `PersistContext` (resuelto desde `talent_profiles.country_id`).
- **`db_column` v1 solo soporta profiles, talent_profiles, client_profiles**. Para orders.X → out-of-scope v1 (requiere context order_id).
- **Cambio de email autenticado** (`auth.updateUser` con confirmación) — out-of-scope v1. Un field email que deba pre-fillear debe ser `db_column → profiles.email`, no `auth`.
- **Auth read siempre undefined** (no pre-fill passwords).

## Out of scope v1 (documentados, no implementar)

- `options_source` dinámico desde tablas
- i18n fallback 3-niveles (locale → country default → 'es'); v1 usa locale → 'es'
- Cascade General→Variante (variants con added/removed/require_overrides)

## Referencias

- Plan completo: `~/.claude/plans/abstract-brewing-glade.md`
- Spec: `docs/features/field-catalog.md`
- Tipos motor: `src/shared/lib/field-catalog/`
- Feature admin: `src/features/field-catalog/`
