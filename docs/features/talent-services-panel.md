# Feature: input_type `talent_services_panel`

## Propósito

Un nuevo `input_type` del field catalog que renderea, en una sola unidad declarativa configurable desde el admin builder, la composición completa que el talent necesita para configurar sus servicios:

1. **Multiselect** filtrado por `published + service_countries.country_id + service_cities.city_id` del talent autenticado.
2. **Botón "Aplicar selección"** que commitea cambios al multiselect (server action).
3. **Acordeón** con un `TalentServiceFormEmbedRenderer` por cada servicio elegido (lazy load on expand).
4. **Status badges**: "Pendiente" / "Guardado ✓" según `form_data IS NOT NULL`.
5. **Bloqueo del submit del step** si `saved < total` o `total === 0` (vía `setFieldError` infra + server-side defense).

El admin lo elige desde el dropdown `input_type` en el field-definition-sheet, lo arrastra al step que quiera de cualquier form, y la unidad funciona end-to-end sin código adicional en cada page consumer.

## Diferencia con el feature anterior (`onboarding-services-step`)

El feature anterior implementó la misma UX **vía `fieldSlots` hardcoded en la onboarding page**. Eso obligó a que cada page consumer del slug `onboarding-talento` replique el slot pattern. Este feature lo encapsula en el catálogo: sin slots, sin actionGuards externos, sin código en cada page.

## Arquitectura — Registry pattern

```
┌─────────────────────────────────────────────────┐
│ src/shared/components/field-renderers/          │
│  - registry.ts: Map<InputType, Renderer>        │  ← shared owns the map
│  - built-ins/* (text, email, multiselect, etc.) │
│  - field-renderers.tsx: lookup en registry      │
│ Built-ins se registran en module init.          │
└─────────────────────────────────────────────────┘
              ▲
              │ feature → shared (regla §3)
              │
┌─────────────────────────────────────────────────┐
│ src/features/talent-services/                   │
│  - init/register-renderers.ts                   │  ← side-effect import
│    registerInputRenderer('talent_services_panel'│
│      , TalentServicesPanel)                     │
│  - components/field-renderers/                  │
│    talent-services-panel.tsx (Client)           │
└─────────────────────────────────────────────────┘
              ▲
              │ app → feature (root layout bootstrap)
              │
┌─────────────────────────────────────────────────┐
│ src/app/[locale]/layout.tsx                     │
│  - import '@/features/talent-services/init/     │
│        register-renderers';                     │
└─────────────────────────────────────────────────┘
```

**Por qué registry y no switch**: el dispatcher viviría en `shared/`, y un switch que importe del feature viola architecture.md §3 ("shared/ no importa de features/"). El registry pattern invierte la dependencia: el feature escribe al registro de shared.

**Trade-off aceptado**: pérdida de TS exhaustivity estática del switch. Mitigado con un test runtime que itera `INPUT_TYPES` y valida `inputRenderers.has(it)`.

## Action contracts

### `loadTalentServicesPanelState(locale): Promise<Result>`

Identidad y context country+city resueltos server-side.

```ts
type Result =
  | {
      ok: true;
      persistedSelection: string[];      // service_ids del talent en talent_services
      availableServices: { id: string; name: string }[];  // filtrados por country+city+published
      services: TalentServiceStatusItem[];  // talent_services rows + status filtrados
      saved: number;
      total: number;
      countryId: string;
      cityId: string | null;
    }
  | { ok: false; reason: 'not-authenticated' | 'no-talent-profile' | 'talent-country-not-set' };
```

`availableServices` se usa como override de `field.options` del multiselect (las options "puras" del catalog son sin filtro por country+city; el panel filtra dinámicamente).

### `loadTalentServiceForExpand({ slug }): Promise<Result>`

Lazy fetch del resolved form de un servicio específico al expandir el acordeón.

```ts
type Result =
  | { ok: true; resolvedForm; formId; serviceId }
  | { ok: false; reason };
```

### Reusados (sin cambios)

- `commitTalentServiceSelection({ serviceIds })` — defense-in-depth + adapter idempotente diff-based. Tiene prop nueva `onCommitSuccess` (en el committer client) — el server action no cambia.
- `submitTalentService({ service_id, form_id, form_data, resolved_form })` — submit individual del embed.

## Flow del usuario

```
1. User abre /onboarding (o cualquier page que embeba el form).
2. RegistrationFormEmbed → FormRenderer renderea step 3 ("Servicios").
3. El field "mis_servicios" tiene input_type=talent_services_panel.
4. Dispatcher → registry → TalentServicesPanel (Client).
5. On mount: loadTalentServicesPanelState(locale).
6. UI: multiselect + committer + accordion items "Pendiente".
7. User toggle multiselect → state local cambia.
8. User clickea "Aplicar selección" → commit server action → router.refresh + onCommitSuccess.
9. Renderer re-fetch state via setRefetchKey → multiselect persistedSelection actualiza.
10. User expand item → loadTalentServiceForExpand(slug) → renderea TalentServiceFormEmbedRenderer.
11. User llena precio → click "Guardar" del embed → submitTalentService → router.refresh.
12. Renderer re-fetch state → badge actualiza a "Guardado ✓".
13. User clickea "Siguiente" del step → setFieldError validates saved===total>0.
    Si OK → onSubmit del step. Si no → mensaje inline.
14. Server-side defense: saveRegistrationStep también valida → defense-in-depth.
```

## Reglas de validación

### Cliente (UX immediate)

`TalentServicesPanel` tiene un `useEffect` con dep `[saved, total]`:
- Si `total === 0` → `setFieldError('atLeastOneService')` → FormRenderer bloquea avance + muestra mensaje.
- Si `saved < total` → `setFieldError('saveAllServicesFirst')`.
- Si OK → `setFieldError(null)`.

### Servidor (defense-in-depth)

`saveRegistrationStep` (post-S7): si el schema del form tiene un field `talent_services_panel`, valida `saved===total>0` antes del submit. Si no cumple, retorna `{ error: { _config: ['saveAllServicesFirst' | 'atLeastOneService'] } }`.

## Persistencia y idempotency

El adapter `service_select` (post-S1 del feature anterior) es **diff-based idempotente**:
- Re-write con misma selección → 0 inserts, 0 deletes, form_data preservado.
- Cambio de selección → solo aplica el diff (insert los nuevos, delete los removidos).

**Doble path posible**:
1. Committer escribe via `commitTalentServiceSelection` → `writeServiceSelect`.
2. Submit del step escribe via `saveRegistrationStep` → `persistFormData` → `writeServiceSelect`.

Ambos llegan al mismo adapter. Si current === persisted, no toca DB. Si hay diff sin commit, el submit aplica el diff. Coherente con el flow pero el flow esperado es: el user clickea "Aplicar selección" antes de avanzar (el committer es el primary write).

## UX states

| Estado | UI |
|---|---|
| Loading initial state | Skeleton con shimmer en el panel completo |
| State loaded, 0 servicios | Multiselect vacío + mensaje "Aún no elegiste ningún servicio" |
| State loaded, N servicios pendientes | Multiselect + N items en acordeón "Pendiente" |
| Selection diff (current ≠ persisted) | Botón "Aplicar selección" enabled + texto "Cambios pendientes" |
| Commit in flight | Botón disabled + spinner |
| Item expanded loading | Skeleton dentro del item |
| Item expanded loaded | TalentServiceFormEmbedRenderer rendereado |
| Item expand error | Mensaje + botón "Reintentar" inline |
| Submit blocked (saved < total) | Mensaje inline en el field + botón "Siguiente" disabled |

## Edge cases

| Edge case | Handling |
|---|---|
| Talent sin auth | `loadTalentServicesPanelState` retorna `not-authenticated`. Renderer muestra mensaje "Iniciá sesión". |
| Talent sin `talent_profiles` row | Reason `no-talent-profile`. Mensaje "Completá tu perfil". |
| Talent sin `country_id` seteado | Reason `talent-country-not-set`. Mensaje "Completá tu país". |
| Servicio elegido pero ya no disponible (admin desactivó / talent cambió de city) | Silent-skip en `getTalentServicesStatus` filtrado. Row de talent_services preservado en DB. |
| Lazy expand falla | Error inline en el item + botón "Reintentar". Otros items intactos. |
| Commit falla con `serviceNotAvailable` | Toast error + botón vuelve a enabled para reintentar. |
| Re-elección destructiva | Adapter diff-based borra solo los removidos. form_data del removido se pierde (consistente con UX confirmada del feature anterior). |
| Concurrent commit + submit | Adapter idempotente neutraliza conflicto. Ambos terminan con la misma DB state. |
| Item expandido tras commit | El refetchKey resetea state de items expandidos a idle. User debe re-expandir. UX: menor — aceptable v1. |

## Migración del onboarding form (S8)

**Problema**: el field `1d78dd8c-86ff-4ffb-8d70-35dd7559f923` (`mis_servicios`, `multiselect_dropdown` + `service_select`) se reusa entre:
- Form de registro (`ec10aa28-...`) step 2.
- Form de onboarding (`68713de7-...`) step 3.

Si cambiamos su `input_type` a `talent_services_panel`, el form de registro también renderearía el panel — pero durante el registro el user NO está autenticado todavía → `loadTalentServicesPanelState` retorna `not-authenticated` y la UX se rompe.

**Solución**: clonar el field para registro.

```sql
-- 1. Insert clon para registro:
INSERT INTO form_field_definitions (id, group_id, key, input_type, persistence_type, …)
  VALUES (<new_uuid>, <same_group>, 'mis_servicios_registro', 'multiselect_dropdown', 'service_select', …);

-- 2. Clonar translations:
INSERT INTO form_field_definition_translations (field_id, locale, label, …)
  SELECT <new_uuid>, locale, label, … FROM form_field_definition_translations WHERE field_id = '1d78dd8c-…';

-- 3. UPDATE schema del registro form:
UPDATE registration_forms
  SET schema = jsonb_set(schema, …, … reemplazar 1d78dd8c por new_uuid en step 2 …)
  WHERE id = 'ec10aa28-…';

-- 4. UPDATE input_type del field original (queda solo en onboarding):
UPDATE form_field_definitions
  SET input_type = 'talent_services_panel'
  WHERE id = '1d78dd8c-86ff-4ffb-8d70-35dd7559f923';
```

**Auditoría DB previa**: confirmar que `1d78dd8c` solo se usa en registro + onboarding. Si aparece en un tercer form, pausar y revaluar.

**Rollback path**: revertir UPDATE input_type, eliminar clon + restaurar schema del registro.

## Cleanup post-S8

- `src/app/[locale]/(talent)/onboarding/page.tsx` se simplifica a `<RegistrationFormEmbed slug="onboarding-talento" cityId locale countryId={…} serviceFilter={{…}} />`. Sin slots, sin actionGuards.
- `TalentServicesAccordion` (Server Component) queda huérfano (la onboarding page no lo usa más; el panel Client no lo reusa porque es Server). **Eliminar**.
- `TalentServiceSelectionCommitter` (Client): el panel LO REUSA con prop nueva `onCommitSuccess`. Mantener.
- `TalentServiceFormEmbedRenderer` (Client): el panel lo invoca para cada item del acordeón. Mantener.

## i18n contract

Keys nuevas en namespace `OnboardingServices`:
- `loadingService` — skeleton del item expandido.
- `expandError` — mensaje cuando lazy fetch falla.
- `retry` — botón retry.

Keys reusadas (del feature anterior):
- `commitSelection`, `commitPending`, `commitInFlight`, `commitSuccess`, `commitError`.
- `statusPending`, `statusSaved`.
- `emptyState`, `atLeastOneService`, `saveAllServicesFirst`, `savedCount`.

5 locales con paridad. Anti-drift test extendido.

## Out of scope v1

- Eager batch fetch de todos los embeds al mount (lazy es la elección v1).
- Adapter `service_select` con detección de input_type (queda idempotente genérico).
- i18n del nombre amigable de input_types en el admin builder.
- SSR pre-fetch del state del panel (Client useEffect es suficiente v1).
- Validación a nivel renderer Client de la regla "saved===total" (delegado a setFieldError + server defense).
- Multi-country talents.
- Soft-delete con preservación de form_data en re-elección destructiva.

## Criterios de aceptación

- [ ] Nuevo `input_type` aparece en el dropdown del field-definition-sheet del admin.
- [ ] Admin crea un field con ese input_type → se guarda en DB con CHECK constraint OK.
- [ ] FormRenderer renderea el panel completo cuando encuentra el field.
- [ ] Registry pattern: el dispatcher rutea correctamente sin switch hardcodeado.
- [ ] Test runtime confirma `inputRenderers.has(it)` para todos los `INPUT_TYPES`.
- [ ] `setFieldError` infra funciona: bloquea submit y muestra mensaje inline.
- [ ] Server-side defense en `saveRegistrationStep` rechaza submit con saved<total.
- [ ] Server actions: identity failures, defense-in-depth, idempotency cubiertos.
- [ ] Renderer Client: tests RTL para multiselect toggle, commit, lazy expand, retry.
- [ ] Migración SQL del field idempotente y reversible.
- [ ] Form de registro NO renderea panel (multiselect plano via clon).
- [ ] Form de onboarding renderea panel completo.
- [ ] Onboarding page sin slots ni actionGuards hardcoded.
- [ ] Locale-parity test verde con 3 keys nuevas en 5 locales.
- [ ] `pnpm test + lint + NODE_ENV=production pnpm build` verdes en cada sesión.

## Cross-references

- `docs/features/talent-services.md` — feature padre.
- `docs/features/talent-service-embed.md` — embed individual reusado en cada item.
- `docs/features/onboarding-services-step.md` — feature anterior (slot pattern, eliminado en S8).
- `docs/features/field-catalog.md` — sistema general de input_types.
- Plan: `~/.claude/plans/abstract-brewing-glade.md`.
