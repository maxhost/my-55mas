# Feature: Talent Tags (Etiquetas de talento)

## Resumen

Sistema de etiquetas categorizadoras planas que el backoffice aplica manualmente (o vía migrador CSV) a los talentos. Reemplaza el campo legacy `55+ Handler` del sistema anterior, que se usaba para marcar estados de gestión (`EMAIL ENVIADO`, `SEM RESPOSTA`, `POSSÍVEL EMBAIXADOR`…). Los nombres de las etiquetas son traducibles en los 5 locales (es/en/pt/fr/ca) y la gestión se realiza desde `/admin/talent-tags`.

**Estructura plana, sin grupos**: un talento tiene N tags, y cada tag tiene un nombre por locale.

## Requisitos

### Funcionales

1. **CRUD de tags**: admin crea, edita, activa/desactiva tags desde `/admin/talent-tags`.
2. **Traducciones por locale**: cada tag puede tener un nombre por locale (es/en/pt/fr/ca). Mínimo una traducción (en `es` o el primer locale provisto).
3. **Slug único auto-generado**: al crear, si no se provee `slug`, se genera desde la primera traducción vía `slugify`. Inmutable tras creación.
4. **Soft delete**: desactivar un tag (`is_active = false`) NO borra asignaciones históricas. No hay hard delete desde la UI.
5. **Ordenamiento**: `sort_order` numérico para controlar el display en listas y selectores.
6. **Consulta por locale con fallback**: `getActiveTags(locale)` devuelve `{ id, name }[]` usando la traducción del locale pedido y fallback a `es` si falta.
7. **Asignación a talentos**: vía tabla `talent_tag_assignments` (talent_id ↔ tag_id) con `assigned_by` (audit) y `created_at`. La UI de asignación manual desde detalle de talento queda FUERA de este feature (Sesión 5 futura).
8. **Integración con migrador**: el migrador de talentos consume tags vía query directa a DB (NO importa `@/features/talent-tags`). Este feature expone los tipos y actions para UI admin, no para el migrador.

### No funcionales

- Feature aislado en `src/features/talent-tags/`. No importa de otros features.
- `src/features/migration/` NO importa de `src/features/talent-tags/` (test de independencia).
- Tipos locales en `types.ts`, NO re-exporta `Tables<'talent_tags'>` de supabase.
- Límites: archivo ≤300 LOC, feature completo ≤1500 LOC.
- i18n: strings de UI en `src/lib/i18n/messages/*.json` bajo `admin.talentTags.*` (Sesión 3).

## Esquema DB

Tablas canónicas en `docs/features/00-database-schema.md` §Capa 6.4. Resumen:

- `talent_tags (id, slug UNIQUE, sort_order, is_active, timestamps)`
- `talent_tag_translations (tag_id, locale → languages.code, name, timestamps)` PK `(tag_id, locale)`
- `talent_tag_assignments (talent_id → talent_profiles, tag_id → talent_tags, assigned_by → profiles ON DELETE SET NULL, created_at)` PK `(talent_id, tag_id)`
- Triggers `handle_updated_at()` en `talent_tags` y `talent_tag_translations`.
- Índice `idx_talent_tag_assignments_tag` para queries inversas (tag → talentos).

## Flujos

### Crear tag
1. Admin abre `/admin/talent-tags` → click "Añadir tag".
2. Introduce nombre en `es` (mínimo) → `slugify` genera `slug`.
3. Opcionalmente añade traducciones en `en/pt/fr/ca` y ajusta `sort_order`.
4. Click "Guardar" → `saveTag(input)` valida con Zod → upsert cascada en DB → `revalidatePath('/admin/talent-tags')`.

### Editar tag existente
1. Admin edita traducciones, `sort_order` o toggle `is_active` inline.
2. `saveTag(input)` con `id` presente → `UPDATE` en `talent_tags` + upsert de `talent_tag_translations` (conflicto en `(tag_id, locale)`).
3. `slug` es inmutable (no se actualiza aunque cambie la UI).

### Desactivar tag (soft delete)
1. Toggle `is_active = false`.
2. El tag desaparece de `getActiveTags(locale)` y del selector del migrador.
3. Las filas existentes en `talent_tag_assignments` se preservan (historial).
4. Reactivación: mismo toggle a `true`.

### Consulta desde migrador (Sesión 4)
El migrador hace query directa a `talent_tags` + `talent_tag_translations` filtrando por `is_active=true` y el `locale` del CSV, con fallback `es`. NO importa `getActiveTags` de este feature.

### Asignación (fuera de scope en sesiones 1–4)
- Bulk: el migrador crea filas en `talent_tag_assignments` tras insertar cada talento.
- Manual: UI en `/admin/talents/[id]` (Sesión 5 futura).

## Criterios de aceptación

- [x] Tablas creadas y tipos TS regenerados (Sesión 1).
- [ ] `saveTag(input)` valida con Zod, persiste tag + traducciones, devuelve `{ data: { id } }` o `{ error }`.
- [ ] `listTags()` devuelve `TalentTagWithTranslations[]` con todas las traducciones indexadas por locale.
- [ ] `getActiveTags(locale)` devuelve solo `is_active=true` con nombre en `locale` o fallback `es`.
- [ ] `deleteTag(id)` hace soft delete (`is_active = false`).
- [ ] Tests unitarios: schemas Zod (valid/invalid), slugify, smoke test de `saveTag`.
- [ ] `grep '@/features/talent-tags' src/features/migration/` → 0 resultados.
- [ ] Todos los archivos ≤300 LOC; feature total ≤1500 LOC.
- [ ] `pnpm lint` + `NODE_ENV=production pnpm build` pasan.

## Fuera de scope

- **UI para asignar tags manualmente desde `/admin/talents/[id]`** — Sesión 5 futura.
- **Auto-crear tags desde CSV**: el migrador omite silenciosamente tags desconocidos con warning (`level: 'info'`).
- **Hard delete**: no se expone; el historial se preserva.
- **Merge de tags**: si dos tags representan lo mismo (ej: typo), reabrir conversación y definir flujo de fusión.
