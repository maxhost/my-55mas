# Field Catalog — Estado y pendientes

> Documento de handoff para retomar el trabajo tras reiniciar la sesión de Claude Code y reparar el MCP de Supabase.
> Última actualización: 2026-04-21

## Contexto

Feature: `docs/features/field-catalog.md` (spec completa).

Objetivo: mover la definición de campos de formulario del JSON inline a un catálogo central en DB, referenciado por UUID desde los forms.

La sesión se interrumpió justo después de crear la migración SQL y los 3 archivos de tipos iniciales. La migración **no se aplicó** porque el MCP de Supabase estaba roto.

## Bloqueador actual: MCP de Supabase

### Diagnóstico
Había dos configs de MCP en conflicto:
- `.mcp.json` (proyecto) → correcto, HTTP hosted: `https://mcp.supabase.com/mcp?features=account,database,development`
- Config local → rota, con placeholder `YOUR_SUPABASE_ACCESS_TOKEN`

### Acción ya tomada
Se eliminó la config local rota con `claude mcp remove supabase -s local`. Queda solo la HTTP del proyecto.

### Para reparar al reiniciar
1. Cerrar Claude Code y volver a abrir en `/Users/maxi/claude-workspace/55mas`
2. Correr `/mcp`, seleccionar `supabase`, seguir flujo OAuth en el browser
3. Verificar con `claude mcp list` — debería decir "connected" en vez de "Needs authentication"

**Fallback si OAuth no funciona:** generar Personal Access Token en https://supabase.com/dashboard/account/tokens y reconfigurar con stdio usando `@supabase/mcp-server-supabase` (paquete oficial, no el `@anthropic-ai/...` que estaba antes).

Proyecto dev: `55mais-dev` — ID `vkfolbfchkwezrbkxpiv` (región eu-west-1). **Nunca tocar producción.**

## Lo que ya está hecho (untracked, no commiteado)

### 1. Spec
`docs/features/field-catalog.md` — 195 líneas, completa.

### 2. Migración SQL (creada, NO aplicada)
`supabase/migrations/20260422_create_field_catalog.sql` — 5 tablas:
- `form_field_groups` + `form_field_group_translations`
- `form_field_definitions` + `form_field_definition_translations`
- `user_form_responses` (UNIQUE por user_id + field_definition_id)
- 4 índices, 2 CHECK constraints (input_type, persistence_type)

### 3. Tipos TypeScript en `src/shared/lib/field-catalog/`
- `types.ts` — `InputType`, `PersistenceType`, targets, `FieldGroup`, `FieldDefinition`, `UserFormResponse`
- `schema-types.ts` — `CatalogFieldRef`, `CatalogFormStep`, `CatalogFormSchema`, `VariantOverride`
- `resolved-types.ts` — `ResolvedField`, `ResolvedStep`, `ResolvedForm`

## Lo que falta

### Pasos inmediatos al retomar
- [ ] Reparar MCP Supabase (ver sección arriba)
- [ ] Aplicar migración al proyecto dev (`supabase db push` o via MCP)
- [ ] Regenerar tipos DB: `supabase gen types typescript --local > src/lib/supabase/database.types.ts`
- [ ] Commitear lo que ya existe como baseline (spec + migración + tipos)

### Motor core (`src/shared/lib/field-catalog/`)
- [ ] `resolve-form.ts` — resuelve CatalogFormSchema → ResolvedForm (carga defs + traducciones + valores previos)
- [ ] `load-form-values.ts` — lee valores actuales del usuario por field_definition_id
- [ ] `persist-form-data.ts` — dispatcher que escribe por persistence_type
- [ ] `cascade-field-refs.ts` — aplica VariantOverride (added/removed/require_overrides) sobre field_refs base
- [ ] `catalog-schema-validation.ts` — Zod discriminated union validando persistence_type + target

### Adapters de persistencia (`src/shared/lib/field-catalog/persistence/`)
- [ ] `db-column.ts` — UPDATE en tabla mapeada
- [ ] `auth.ts` — signUp via Supabase Auth (no read)
- [ ] `form-response.ts` — UPSERT en `user_form_responses`
- [ ] `survey.ts` — UPSERT en `survey_responses`
- [ ] `service-select.ts` — UPSERT en `talent_services`
- [ ] `subtype.ts` — UPSERT en `talent_service_subtypes`

### Feature admin (`src/features/field-catalog/`)
- [ ] `schemas.ts` — Zod schemas para grupos y definiciones
- [ ] `actions/list-field-catalog.ts`
- [ ] `actions/save-field-group.ts`
- [ ] `actions/save-field-definition.ts`
- [ ] `actions/toggle-field-active.ts`
- [ ] `components/field-catalog-manager.tsx`
- [ ] `components/field-group-card.tsx`
- [ ] `components/field-definition-editor.tsx`
- [ ] Ruta `/admin/field-catalog` (page + layout)

### Integraciones
- [ ] Registration forms → usar CatalogFormSchema en vez de FormField[] inline
- [ ] Talent service forms → idem
- [ ] Validación server-side de `required` antes de persistir
- [ ] Validación de que todos los UUIDs del schema existen en `form_field_definitions`

### Tests (`src/shared/lib/field-catalog/__tests__/`)
- [ ] resolve-form
- [ ] cascade-field-refs
- [ ] persist-form-data (dispatcher)
- [ ] cada adapter de persistencia
- [ ] validación Zod

### Verificación final
- [ ] Build pasa con `NODE_ENV=production pnpm build`
- [ ] `pnpm lint` limpio
- [ ] Fallback i18n 3 niveles funcionando: locale → país default → 'es'

## Plan de sesiones sugerido (a validar al retomar)

Propuesta inicial — revisar exhaustivamente antes de aprobar (feedback: el usuario espera múltiples rondas de revisión buscando gaps).

1. **Sesión 1 — DB baseline:** aplicar migración, regenerar tipos, commit baseline, seed mínimo (1 grupo, 3 campos de prueba)
2. **Sesión 2 — Motor core + validación Zod:** resolve-form, load-form-values, cascade-field-refs, catalog-schema-validation + tests
3. **Sesión 3 — Adapters de persistencia:** 6 adapters + persist-form-data dispatcher + tests
4. **Sesión 4 — Admin CRUD (backend):** schemas + 4 actions + tests
5. **Sesión 5 — Admin CRUD (UI):** 3 componentes + ruta `/admin/field-catalog`
6. **Sesión 6 — Integración registration:** migrar un form real, validar end-to-end
7. **Sesión 7 — Integración talent_service:** migrar el flujo restante, verificación final de build + criterios de aceptación

## Referencias

- Spec: `docs/features/field-catalog.md`
- Memoria relacionada: `project_db_schema_decisions.md`, `project_supabase_environments.md`
- Feature anterior (completa): `db_column` field type — ver memoria `project_db_column_sessions_plan.md`
