# Talent onboarding (Phase D)

Wizard multi-step que el talento completa después de su registro inicial. Al
finalizar, queda marcado el `onboarding_completed_at` y el talento puede entrar
al portal. La aprobación final (`status = 'approved'`) es independiente y queda
en manos del admin.

## Goal

Capturar todos los datos necesarios del talento + sus respuestas a preguntas
específicas por servicio que va a brindar + su precio por servicio, en un flujo
guiado y persistente.

El talento puede salir y volver — el wizard reanuda en el step donde quedó,
calculado a partir de la DB (sin trackeo explícito de `current_step`).

## Out of scope

- Aprobación de talentos (lo hace admin manualmente, fuera de este flow).
- Notificaciones (email a admin de "nuevo talento completó onboarding") — se
  resuelve en una sesión aparte.
- Gestión post-onboarding del talento sobre sus servicios (alta/baja, edición
  de respuestas, modificación de precio). Será una feature paralela en
  `/portal/services`.
- Editor admin para `survey_questions` — ya existe en `/admin/survey-questions`.
- Activación de RLS en tablas escritas — alineado con `project_construction_rls_stance`
  (admin público durante construcción). Las policies se diseñan después.

## Decisiones de diseño

- **País read-only en step 2**: viene del registro y no se puede modificar.
  Solo ciudad, dirección y código postal son editables. Esto evita la cascada
  de invalidaciones cross-step que tendría un cambio de país.
- **Wizard step-by-step con persistencia inmediata**: cada step guarda a DB al
  hacer "Guardar y continuar". El talento puede salir y volver.
- **Step inicial al volver = primer step incompleto**, calculado leyendo la DB.
  No persistimos `current_step` (evita drift).
- **`talent_profiles.onboarding_completed_at` (timestamp)** como marca de
  finalización. NO se cambia `status` a 'approved' — eso lo hace admin después.
- **Idiomas → junction relacional nueva** `talent_spoken_languages` con FK a
  `spoken_languages`. Migrar `profiles.other_language[]` legacy en S1.
- **`talent_services.unit_price` siempre con valor** post-onboarding: si el
  talento no overrideó, snapshot del precio sugerido.
- **Hard delete de `talent_services`** cuando el talento deselecciona un
  servicio. La tabla es de "preferencias actuales", no histórico. `orders` no
  tiene FK a `talent_services` (orders.talent_id apunta a `profiles.id`), así
  que no rompe nada.
- **Tab admin**: "Preguntas cliente" + "Preguntas talento" como tabs
  principales separadas (no sub-tabs). Refactor del `<QuestionsEditor>` para
  aceptar prop `target: 'client' | 'talent'`.
- **Edad mínima 55 años** validada en step 1 (Zod check sobre birth_date).
- **Edición desde summary**: cada step recibe prop `mode: 'wizard' | 'edit'`.
  En modo wizard el botón es "Guardar y continuar"; en modo edit, "Guardar y
  volver al resumen".

## Estructura del wizard (7 steps + summary)

### Step 1 — Datos personales
- **Género** (singleSelect): valores `male` / `female`.
- **Fecha de nacimiento** (date): validación `>= 55 años de edad`.
- Persiste en: `profiles.gender`, `profiles.birth_date`.
- Required: ambos.

### Step 2 — Contacto y dirección
- **Método de contacto preferencial** (singleSelect): valores `whatsapp` / `email` / `phone`.
- **Dirección** (Mapbox autocomplete, mismo `<AddressAutocomplete>` que ya tenemos), restringido al país del registro.
- **País**: badge read-only mostrando el país del registro.
- **Ciudad** (pre-llenada del Mapbox feature, fallback a dropdown manual igual que `service_hire`).
- **Código postal** (pre-llenado del Mapbox feature, editable).
- Persiste en:
  - `profiles.preferred_contact`
  - `profiles.address` jsonb (street, postal_code, lat, lng, mapbox_id, raw_text, country_code, city_name)
  - `profiles.preferred_city`
- `profiles.preferred_country` no se modifica en este step (queda con el valor del registro).
- Required: contacto, dirección completa, ciudad. Postal opcional (Mapbox lo da en general).

### Step 3 — Situación profesional
- **Situación profesional** (singleSelect): valores `pre_retired` / `unemployed` / `employed` / `retired`.
- **Experiencia profesional anterior** (multilineText, opcional).
- Persiste en:
  - `talent_profiles.professional_status` (existe)
  - `talent_profiles.previous_experience` (NUEVO)
- Required: situación.

### Step 4 — Servicios y precio
- **Selector de servicios** (multi-select de servicios disponibles en el país del talento).
- Pre-llenado: lo que el talento eligió en su registro.
- **Accordion** con un panel por cada servicio seleccionado. Cada panel:
  - **Precio sugerido** (read-only): viene de `service_cities.base_price` para el (service, city) si existe; fallback a `service_countries.base_price` para el (service, country).
  - **Checkbox** "No acepto el precio sugerido" → al activar, aparece input de `unit_price` que arranca con el precio sugerido como default. Editable.
  - **`<ServiceQuestionsRenderer>`** con las `services.talent_questions` del servicio.
- Persiste en:
  - `talent_services` (PK compuesto talent_id + service_id + country_id) — una row por servicio seleccionado.
  - `talent_services.unit_price` siempre con valor (sugerido si no overrideó, modificado si sí).
  - `talent_services.form_data` jsonb con respuestas a `talent_questions`.
  - `talent_service_subtypes(talent_id, subtype_id, question_key)` — mirror relacional para respuestas tipo subtype (PK extendido con `question_key`).
- **Hard delete** de la row en `talent_services` + `talent_service_subtypes` cuando el talento quita un servicio. Limpieza completa.
- Required: ≥ 1 servicio + responder todas las preguntas required de cada servicio + precio definido por cada uno.

### Step 5 — Pagos
- **¿Estás dado de alta en la Seguridad Social?** (boolean: sí / no).
- **Método de pago preferencial** (singleSelect): valores `monthly_invoice` / `accumulate_credit`.
- Persiste en:
  - `talent_profiles.has_social_security` (NUEVO)
  - `talent_profiles.preferred_payment` (existe)
- Required: ambos.

### Step 6 — Idiomas
- **Multi-select de idiomas** de `spoken_languages` activos.
- Pre-llenado: el `locale` actual del path (e.g., `/es/...` → `es` → "Español").
- El talento puede eliminar el pre-llenado pero debe quedar al menos 1 idioma.
- Persiste en: `talent_spoken_languages` (NUEVA tabla junction).
- Required: ≥ 1.

### Step 7 — Otros (survey)
- Renderiza dinámicamente las `survey_questions` activas (hoy hay 2 tipo `text`).
- Mapping `survey_questions.response_type` → `QuestionType` del framework via adapter:
  - `text` → `text`
  - `multiline_text` → `multilineText`
  - `single_select` → `singleSelect` (usa `survey_questions.options`)
  - `multi_select` → `multiSelect`
  - `boolean` → `boolean`
  - `number` → `number`
  - desconocido → fallback `text`
- Persiste en: `survey_responses(user_id, key, value)` — UPSERT por (user_id, key). El `value` se serializa: scalars como string, arrays/objetos como JSON.
- Required: las que el admin marque como tal. Hoy `survey_questions` no tiene `is_required` — asumimos todas las activas son opcionales (no bloquean). Si el admin necesita required, agregar columna en S1 o sesión futura.
- **Si no hay survey_questions activas**: step muestra "No hay preguntas adicionales" y permite continuar sin bloqueo.

### Summary
Después del step 7, pantalla de resumen con todas las secciones renderizadas como cards read-only:
- Cada card tiene un botón **Editar** que vuelve al step correspondiente en `mode='edit'`.
- Al guardar la edición, el wizard vuelve directamente al summary (no al step siguiente).
- Botón **"Continuar"** al final del summary:
  - Llama `complete-onboarding` action → setea `talent_profiles.onboarding_completed_at = now()`.
  - Redirect a una ruta TBD (el user la pasa después).

Si el talento entra a `/portal/onboarding` con `onboarding_completed_at` no nulo → redirigir directo a la ruta post-onboarding.

## Cambios DB necesarios

```sql
-- Migration A: columnas nuevas en talent_profiles
ALTER TABLE talent_profiles
  ADD COLUMN previous_experience text,
  ADD COLUMN has_social_security boolean,
  ADD COLUMN onboarding_completed_at timestamptz;

-- Migration B: junction relacional para idiomas + backfill + drop legacy column
CREATE TABLE talent_spoken_languages (
  talent_id uuid NOT NULL REFERENCES talent_profiles(id) ON DELETE CASCADE,
  language_code text NOT NULL REFERENCES spoken_languages(code) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (talent_id, language_code)
);
CREATE INDEX idx_tsl_language ON talent_spoken_languages(language_code);

INSERT INTO talent_spoken_languages (talent_id, language_code)
SELECT tp.id, unnest(p.other_language)
FROM talent_profiles tp
JOIN profiles p ON p.id = tp.user_id
WHERE p.other_language IS NOT NULL AND array_length(p.other_language, 1) > 0
  AND EXISTS (SELECT 1 FROM spoken_languages sl WHERE sl.code = ANY(p.other_language))
ON CONFLICT DO NOTHING;

ALTER TABLE profiles DROP COLUMN other_language;

-- Migration C: preguntas talento por servicio
ALTER TABLE services ADD COLUMN talent_questions jsonb NOT NULL DEFAULT '[]';

-- Migration D: extender talent_service_subtypes con question_key
-- Si la tabla está vacía, simple ALTER. Si tiene rows legacy, question_key queda nullable
-- y aceptamos rows con NULL como "subtype seleccionado fuera de pregunta específica".
ALTER TABLE talent_service_subtypes
  ADD COLUMN question_key text,
  DROP CONSTRAINT talent_service_subtypes_pkey,
  ADD CONSTRAINT talent_service_subtypes_pkey
  PRIMARY KEY (talent_id, subtype_id, question_key);
```

## Cómo se calcula el step inicial al volver

Al cargar el wizard, leer la DB del talento y devolver el primer step que no esté completo:

```
Step 1: profiles.gender IS NOT NULL AND profiles.birth_date IS NOT NULL
Step 2: profiles.preferred_contact + profiles.address.country_code + preferred_city + address.raw_text
Step 3: talent_profiles.professional_status IS NOT NULL
Step 4: count(talent_services WHERE talent_id = ...) > 0
        + cada uno tiene unit_price NOT NULL
        + cada uno tiene answers required completas (validar contra services.talent_questions)
Step 5: talent_profiles.has_social_security IS NOT NULL AND preferred_payment IS NOT NULL
Step 6: count(talent_spoken_languages WHERE talent_id = ...) >= 1
Step 7: si hay survey_questions con `is_required=true` (hoy no existe; treat all as optional) →
        responsable de validar que todas tengan respuesta. Sin required → step pasa siempre.
```

Si todos los steps están completos → ir directo al summary.

## Casos de borde

### Talento sin servicios disponibles en su país
Si el talento elige un país donde no hay servicios activos, step 4 bloquea con
mensaje "No hay servicios disponibles en tu país. Contactá a soporte." No se
puede continuar el onboarding. (Caso edge porque el país viene del registro
donde validamos disponibilidad).

### Mapbox no devuelve city/postal
Mapbox falla a veces. Step 2 maneja:
- Si Mapbox devuelve dirección sin `address_level2` (city) → fallback dropdown manual de cities del país (igual patrón que `service_hire`).
- Si Mapbox devuelve sin `postcode` → input de postal queda vacío y editable.

### Survey questions con response_types nuevos
Hoy solo `text`. Si admin agrega tipos vía /admin/survey-questions, el adapter mapea conocidos y fallback a `text` para desconocidos. Aceptable.

### Subtypes legacy en talent_service_subtypes (sin question_key)
La migration deja `question_key` nullable, rebuilds el PK incluyendo la columna. Las rows legacy quedan con `question_key = NULL` (válido en PK porque es text, no estrictamente NULL). Si se duplica el (talent, subtype, NULL), el PK rechaza — esperamos que no haya legacy con dupes.

### Talento ya completó onboarding
Si entra a `/portal/onboarding` con `onboarding_completed_at` no nulo → redirect a la ruta post-onboarding (TBD). No mostrar el wizard de nuevo. Edición post-onboarding va en `/portal/services` (Phase D-bis, fuera de scope).

### Desconexión durante save
Si el save de un step falla (network/DB error), mostrar error inline + botón "Reintentar". No avanzar.

## RLS y permisos

Las tablas escritas por el wizard (`profiles`, `talent_profiles`, `talent_services`,
`talent_service_subtypes`, `talent_spoken_languages`, `survey_responses`) tienen
RLS **desactivada** hoy. Esto está alineado con la decisión "Admin dashboard
público durante construcción" (memoria `project_construction_rls_stance`).

Las server actions del wizard usan el cliente Supabase normal (no service_role)
porque las tablas no están protegidas. Cuando se active RLS en una sesión
futura, hay que crear policies explícitas.

## Admin UI: nueva tab "Preguntas talento"

En `/admin/services/[id]`:
- Renombrar tab "Preguntas" → **"Preguntas cliente"**.
- Agregar tab **"Preguntas talento"**.

Refactor del componente `<QuestionsEditor>` para aceptar prop:
```ts
type Props = {
  serviceId: string;
  initialQuestions: Question[];
  assignedGroups: AssignedSubtypeGroup[];
  target: 'client' | 'talent';  // NUEVO
};
```

El `saveServiceQuestions` action recibe `target` y persiste a `services.questions` (cliente) o `services.talent_questions` (talento) según corresponda.

i18n: agregar keys `tabClientQuestions` + `tabTalentQuestions` en los 5 locales.

## Sesiones planificadas (7 sesiones, con paralelización)

### S1 — DB foundation (orquestador, secuencial)
- Migration A: ALTER talent_profiles (3 columnas).
- Migration B: CREATE talent_spoken_languages + backfill + DROP profiles.other_language.
- Migration C: ALTER services ADD talent_questions.
- Migration D: ALTER talent_service_subtypes con question_key + rebuild PK.
- Regenerar `database.types.ts`.
- ~100 LOC SQL.

### S2 — Admin: refactor QuestionsEditor + tab "Preguntas talento" (orquestador, secuencial)
- Refactor `<QuestionsEditor>` con prop `target`.
- Update `saveServiceQuestions` action para target.
- Update `service-edit-tabs.tsx`: rename + nueva tab.
- i18n keys en 5 locales.
- Tests del action con cada target.
- ~200 LOC.

### S3 — Talent-onboarding feature foundation (orquestador, secuencial)
Foundation que los agentes paralelos consumen en S4 y S5:
- `src/features/talent-onboarding/types.ts` (sectionState, OnboardingState, types por step).
- `src/features/talent-onboarding/schemas.ts` (Zod por sección, validaciones inter-field).
- `src/features/talent-onboarding/lib/compute-current-step.ts` (calcula step inicial).
- `src/features/talent-onboarding/lib/section-validators.ts` (helpers).
- `src/features/talent-onboarding/lib/survey-adapter.ts` (response_type → QuestionType).
- `src/features/talent-onboarding/actions/load-onboarding-state.ts` (carga toda la DB del talento).
- Tests unitarios de compute-current-step + validators + survey-adapter.
- ~350 LOC.

### S4 — Save actions (PARALELO, 4 agentes)
Cada slice toca archivos disjuntos + tablas DB independientes:

**S4a** — Steps 1-2 actions (toca `profiles`):
- `actions/save-personal-data.ts` (gender, birth_date)
- `actions/save-contact-address.ts` (preferred_contact, address jsonb, preferred_city)

**S4b** — Steps 3+5 actions (toca `talent_profiles`):
- `actions/save-professional-situation.ts` (professional_status, previous_experience)
- `actions/save-payments.ts` (has_social_security, preferred_payment)

**S4c** — Step 4 action (toca `talent_services` + `talent_service_subtypes`):
- `actions/save-services-and-pricing.ts` (más complejo: hard delete + upsert + subtypes mirror)

**S4d** — Steps 6-7 + complete (toca `talent_spoken_languages`, `survey_responses`, `talent_profiles.onboarding_completed_at`):
- `actions/save-languages.ts`
- `actions/save-survey-responses.ts`
- `actions/complete-onboarding.ts`

Total ~600 LOC distribuidas. Tests por action.

### S5 — Step components (PARALELO, 4 agentes)
Cada slice toca archivos disjuntos:

**S5a** — Steps 1-2:
- `components/steps/personal-data-step.tsx`
- `components/steps/contact-address-step.tsx`

**S5b** — Steps 3+5:
- `components/steps/professional-situation-step.tsx`
- `components/steps/payments-step.tsx`

**S5c** — Step 4 (más compleja):
- `components/steps/services-step.tsx` (multi-select + accordion + ServiceQuestionsRenderer + precio override)

**S5d** — Steps 6-7:
- `components/steps/languages-step.tsx`
- `components/steps/survey-step.tsx`

Total ~700 LOC distribuidas.

### S6 — Wizard orchestrator + summary (orquestador, secuencial)
- `components/onboarding-wizard.tsx`: state machine, current step, navegación, mode 'wizard'/'edit'.
- `components/summary.tsx`: render cards read-only por sección con botones Editar.
- `components/step-header.tsx`: indicador visual de progreso (1/7, 2/7, etc.).
- Tests del orchestrator (transiciones de estado, mode toggling).
- ~300 LOC.

### S7 — Página + i18n + smoke (orquestador, secuencial)
- `app/[locale]/(talent)/portal/onboarding/page.tsx` que monta el wizard.
- Redirect si `onboarding_completed_at` no nulo.
- i18n: agregar todos los namespaces `TalentOnboarding.*` en 5 locales con paridad (test locale-parity).
- `pnpm build` + `pnpm test` + smoke E2E manual.
- ~150 LOC.

**Total estimado**: ~2400 LOC distribuidas. La feature `talent-onboarding/` queda cerca de 1500 (límite por feature en CLAUDE.md). Si crece más en S6, partir el orchestrator en sub-components.

### Dependencias entre sesiones

```
S1 ──▶ S2 ──▶ S3 ──┬──▶ S4a ─┐
                   ├──▶ S4b ─┤
                   ├──▶ S4c ─┤
                   ├──▶ S4d ─┤
                   ├──▶ S5a ─┤
                   ├──▶ S5b ─┤
                   ├──▶ S5c ─┤
                   └──▶ S5d ─┴──▶ S6 ──▶ S7
```

**Paralelización**: después de S3, las 8 sub-tareas (S4a-d + S5a-d) son paralelizables. En la práctica conviene hacer S4 antes de S5 porque los components consumen los actions, pero se puede correr S4 en paralelo (4 agentes) y luego S5 en paralelo (4 agentes). Eso baja el tiempo total significativamente.

## Riesgos

- **Backfill de `profiles.other_language`** puede tener datos sucios (idiomas que no existen en `spoken_languages` por inconsistencias del legacy import). El insert con ON CONFLICT + filtro EXISTS los descarta silently. Verificar conteo antes/después.

- **Step 4 con muchos servicios**: si un talento elige 8+ servicios cada uno con 5 preguntas, el accordion se vuelve largo. Considerar paginación o mostrar uno expandido a la vez. MVP: todos plegables, ninguno auto-expandido.

- **Validación inter-step (cleanup talent_services)**: hard delete cuando se quita un servicio puede confundir si el talento "vuelve" y agrega de nuevo el mismo servicio — empieza con form_data vacío. Aceptable: hacer un alert "Esto borrará tus respuestas para ese servicio" antes del save.

- **i18n del wizard**: 7 steps × 5 locales × ~10 keys cada uno = ~350 traducciones. Agrupar bien los namespaces (`TalentOnboarding.steps.personalData.*`, etc.) y validar paridad con el test existente.

- **Survey questions con response_type futuros**: si admin agrega tipo no soportado por el adapter, fallback a text. Decidir si requiere validación admin-side o aceptamos el fallback.

- **`talent_service_subtypes` PK con question_key NULL**: si hay rows legacy con NULL y se intenta insertar la misma combinación, el PK lo rechaza. Esperamos que la tabla esté vacía o sin dupes legacy. Verificar conteo en S1.

- **Mapbox `countryCodes` en step 2**: el componente recibe array de codes. Como el país es read-only, lo pasamos siempre con el código del país del registro. Sin re-evaluación dinámica.

- **Edición desde summary preserva state**: cuando el talento clickea "Editar" en una sección, el step recibe los datos actuales de la DB (no en memoria). Eso garantiza consistency si el talento abre el wizard en otra pestaña en paralelo.

## Referencias

- Phase A spec: `docs/features/talent-registration.md`
- Pattern reutilizable: `src/features/talent-registration/`
- Question framework: `src/shared/lib/questions/` + `src/shared/components/question-renderers/`
- Service questions admin: `src/features/service-questions/`
- Service hire form (auth gate, file upload, FormData submit): `src/features/service-hire/`
