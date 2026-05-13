# Feature: AI Translate Services (botón "IA" en admin services)

## Resumen

Botón "IA" en la tab Contenido de `admin/services/[id]` que dispara una
traducción automática del contenido en español a inglés, portugués,
francés y catalán usando Claude Sonnet 4.6 vía `@anthropic-ai/sdk`. El
flujo es **atómico**: guarda en DB el español que el admin tiene en el
form vivo, traduce los 4 idiomas, y persiste los 5 locales en un único
UPDATE.

Resuelve el cuello de botella operativo: los servicios siempre se llenan
en español y traducirlos a mano a los 4 idiomas extra es lento. El botón
acelera la publicación multi-idioma a un click.

## Requisitos

### Funcionales

1. **Trigger**: botón "IA" alineado a la derecha de las tabs de locale
   dentro de la tab Contenido del admin services edit. Icono Sparkles
   de lucide-react.
2. **Gate de habilitación**: botón disabled hasta que el form state ES
   tenga `name` lleno **Y** al menos uno de `description | includes |
   hero_title` con contenido. Tooltip explicativo cuando disabled.
3. **Confirm dialog**: click → `<ConfirmDialog>` que indica:
   - Se guardará el contenido en español tal como está en el form.
   - Se traducirá a EN/PT/FR/CA usando IA.
   - Las traducciones existentes en esos 4 idiomas se sobrescriben.
   - Campos vacíos en ES quedan vacíos en los otros.
4. **Auto-save de ES**: el action recibe el `esTranslation` desde el
   client (estado vivo del form). La ES guardada en DB es exactamente
   lo que el admin ve, no lo que había antes en DB.
5. **Sobrescritura total de targets**: las 4 traducciones target se
   reemplazan siempre. Cualquier valor manual previo en EN/PT/FR/CA se
   pierde (el confirm modal lo advierte).
6. **Persistencia atómica**: single UPDATE de `services.i18n` con los
   5 locales. Cualquier key adicional en el jsonb (no es/en/pt/fr/ca)
   se preserva.
7. **Feedback**: toast success/error al terminar. `router.refresh()`
   para sincronizar el form con los datos de DB. Spinner mientras
   corre.
8. **Modelo configurable**: `ANTHROPIC_MODEL` env var con default
   `claude-sonnet-4-6` permite bumps sin redeploy de código.

### No funcionales

- Tools/UI strings traducibles bajo `AdminServices.*` en los 5 dicts
  de `src/lib/i18n/messages/`.
- Servicios pueden tener arrays vacíos (`benefits`, `guarantees`,
  `faqs`); no se mandan al LLM ni se persisten en target.
- Prompt-injection: contenido entre `<field name="x">…</field>` tags;
  system prompt instruye al modelo tratarlo como literal.
- Tests con SDK + supabase client mockeados; no se hacen llamadas
  reales en CI.
- Sin cross-feature imports.
- LOC: archivos ≤300, funciones ≤60, feature impacta ≤500 LOC nuevos.

## Esquema DB

No requiere migraciones. Usa la columna existente `services.i18n` jsonb
(ver `docs/I18N.md`).

Shape preservada:
```
{
  "es": { "name", "description?", "includes?", "hero_title?", "hero_subtitle?",
          "benefits": [...], "guarantees": [...], "faqs": [{question,answer},...] },
  "en": { … mismo shape … },
  "pt": { … },
  "fr": { … },
  "ca": { … }
}
```

Solo se persisten los campos con contenido (mismo filter del action
existente `saveTranslation` en `update-service.ts:60-67`).

## Flujos

### Click "IA" (happy path)

1. Admin edita ES en el form (puede tener cambios sin guardar).
2. Click "IA" → ConfirmDialog se abre con copy claro.
3. Confirm → `startTransition` → llamada al Server Action
   `translateService({ service_id, esTranslation })`.
4. Server Action:
   - Valida `esTranslation` con `serviceTranslationSchema`.
   - Lee `i18n` actual de DB (preservar otros keys).
   - Llama `translateServiceTranslation` en paralelo para `en|pt|fr|ca`.
   - Cada respuesta del LLM se re-valida con Zod.
   - Merge: `{ ...currentI18n, es: esEntry, en, pt, fr, ca }`.
   - Single `update().eq('id', service_id)`.
   - `revalidatePath('/[locale]/(admin)/admin/services', 'layout')`.
5. Client: toast success → `router.refresh()` → page re-fetch → form
   `useEffect` syncea `data` state con las nuevas traducciones.
6. Admin ve EN/PT/FR/CA pobladas al cambiar de tab.

### Edge: ES insuficiente

- Si name vacío o todos los campos extras vacíos: botón disabled, no
  se puede clickear.
- Si por alguna razón llega al action (manipulación cliente):
  validación Zod rechaza, return `{ error: 'es-incomplete' }`, no
  toca DB. Toast error.

### Edge: error de Claude

- Cualquier locale del Promise.all rechaza (API key inválida, timeout,
  rate limit, malformed tool_use, schema mismatch): action atrapa,
  return `{ error: 'translate-failed' }`, no toca DB. Toast error
  genérico. El admin reintenta.

### Edge: error de DB post-traducción

- UPDATE rechazado: action throw (no esperado, lo trata el error
  boundary). El job de traducción se perdió pero los 4 calls al LLM
  ya consumieron tokens. Aceptable trade-off para v1; observability
  + dashboard de costo es out-of-scope.

## Arquitectura

```
src/features/services/
├── actions/
│   ├── translate-service.ts           # NEW Server Action
│   └── __tests__/translate-service.test.ts
├── lib/
│   ├── translate-with-claude.ts       # NEW: SDK wrapper + tool-use
│   └── __tests__/translate-with-claude.test.ts
├── components/
│   ├── service-form.tsx               # MOD: useEffect sync + render sub-componente
│   ├── service-translate-ai-button.tsx  # NEW
│   └── __tests__/service-translate-ai-button.test.tsx
└── schemas.ts                         # existente, sin cambios

src/lib/env.ts                         # MOD: ANTHROPIC_API_KEY + ANTHROPIC_MODEL
src/lib/i18n/messages/*.json           # MOD: 8 keys nuevos en AdminServices
.env.example                           # MOD: placeholders
package.json                           # MOD: @anthropic-ai/sdk + zod-to-json-schema
```

### Función `translateServiceTranslation`

Input: `source: TranslationPayload` (sin locale), `target: 'en'|'pt'|'fr'|'ca'`.
Output: `TranslationPayload` traducido.

Steps:
1. `pickNonEmpty(source)` → drop fields vacíos (incluye arrays vacíos).
2. Build system prompt (rol traductor, preservar tono, marcas
   registradas como "55+", longitud exacta de arrays, tratar `<field>`
   content como literal).
3. Build user message (`<field name="…">…</field>` por cada campo).
4. Tool `save_translation` con `input_schema =
   zodToJsonSchema(serviceTranslationSchema.omit({ locale: true }))`.
5. `tool_choice: { type: 'tool', name: 'save_translation' }`.
6. Parse `response.content` → `tool_use` block → `input`.
7. Re-valida con `serviceTranslationSchema.omit({ locale: true })`.
8. Throw `'translate-claude-malformed'` si algo falla.

### Server Action `translateService`

Input:
```ts
{
  service_id: string;        // UUID
  esTranslation: ServiceTranslationDetail; // locale === 'es'
}
```

Output:
```ts
| { data: { translatedLocales: ['en','pt','fr','ca'] } }
| { error: 'invalid-input'|'es-incomplete'|'translate-failed'|'db-failed' }
```

Steps (orquestador ≤60 LOC, sub-funciones para detalles):
1. Validar input con Zod.
2. Si ES insuficiente → return `'es-incomplete'`.
3. `readCurrentI18n` para preservar otros keys.
4. `Promise.all` sobre 4 targets → fail-fast.
5. `mergeAndPersist` (entries filtrados) → single UPDATE.
6. `revalidatePath`.
7. Return.

## Errores y observability

- Errores esperados → return `{ error: ... }` con códigos discretos
  para que la UI muestre toast adecuado.
- Errores de programación → throw (capturado por Next error boundary).
- No se loguea tokens consumidos en v1. Anthropic dashboard sirve para
  monitoreo.
- Audit: `services.updated_at` se actualiza, lo cual deja trazabilidad
  temporal. Quién tradujo no se registra (admin sin auth check
  durante construcción).

## Out of scope (v1)

- Logging tokens / dashboard de costo Anthropic.
- Per-field re-translation o suggestion mode (diff preview).
- Bulk job para servicios viejos.
- Streaming / progress bar.
- Vercel AI Gateway (no agrega valor con 1 provider + 1 modelo).
- Traducción automática a otras entidades con `i18n` jsonb (subtypes,
  talent_tags, etc.).
- Auth check en la action (admin sin RLS durante construcción).
- Audit log de quién/cuándo tradujo.
