# Feature: Talent Service Form Embed

## Propósito

Componente embeddable que permite renderizar el formulario de un servicio de talento (`talent_forms`) en cualquier página del sitio mediante un único snippet copiable, identificado por el slug del servicio. Equivalente a `RegistrationFormEmbed` para registration forms, pero para formularios atados a un servicio.

## Casos de uso

1. **Talent en su país, con city configurada** → form se renderiza con la variante de la city.
2. **Talent en su país, sin city variant** → fallback a la variante general del servicio.
3. **Talent en otro país que el sitio** → el embed muestra mensaje "no disponible en este país", no renderiza form.
4. **Talent sin país seteado en su profile** → mensaje "completá tu país antes de continuar" (distinto de country mismatch).
5. **Visitante no autenticado** → mensaje "iniciá sesión para continuar".
6. **Slug del servicio inexistente o desactivado** → mensaje correspondiente; no expone si fue por bug o por config.

## Diferencia con RegistrationFormEmbed

| Aspecto | RegistrationFormEmbed | TalentServiceFormEmbed |
|---|---|---|
| Identifier | `slug` de `registration_forms.slug` | `slug` de `services.slug` |
| Target | Onboarding / signup / edit profile | Form de un servicio que el talent ofrece |
| Auth | Soporta signup (acción `register`) | Solo edit; rechaza acción `register` |
| Country | Pasado como prop opcional por el embedder | Resuelto server-side desde `talent_profiles`; gateado contra `siteCountryId` |
| City | Pasado como prop por el embedder | Resuelto server-side desde `talent_profiles.city_id` |
| Identidad | `userId` resuelto server-side | `talentId` resuelto server-side desde session + `talent_profiles` |

## Modelo mental

```
┌──────────────────────────────────────────────────────┐
│ Sitio front (55mas Argentina, siteCountryId = "ar")  │
│                                                       │
│   <TalentServiceFormEmbed                            │
│     slug="plomeria"                                  │
│     siteCountryId="ar"                               │
│     locale="es"                                      │
│   />                                                 │
│                                                       │
│   ↓ Server wrapper resuelve (estrictamente serial):  │
│     1. supabase.auth.getUser() → userId              │
│     2. resolveTalentAccess(userId, siteCountryId)    │
│        → granted | reason                            │
│     3. (si granted) getResolvedEmbeddableTalentForm( │
│             slug, talent.cityId, locale, userId)     │
│        → available | reason                          │
│     4. Render Renderer o EmbedUnavailable            │
│                                                       │
│   ↓ submitTalentService resuelve identity + country  │
│     desde session + talent_profiles. El client NO    │
│     pasa talent_id ni country_id.                    │
└──────────────────────────────────────────────────────┘
```

## Contrato de la API pública

```tsx
<TalentServiceFormEmbed
  slug={string}              // requerido, services.slug
  siteCountryId={string}     // requerido, country_id del sitio donde se embebe
  locale={string}            // requerido, locale activa
  onSubmit?={(data) => void | Promise<void>}  // opcional, callback post-success
/>
```

`TalentServiceFormEmbed` es el **Server Component wrapper**, la API pública. Internamente delega al Client Component `TalentServiceFormEmbedRenderer` (implementation detail).

### Comportamiento de `onSubmit`

- Invocado **después** de que la server action retorna success y **antes** del toast.
- Firma: `(formData: Record<string, unknown>) => void | Promise<void>`.
- Awaited si retorna Promise.
- **Un error en el callback NO revierte el save**. Útil para tracking, redirect, side-effects no críticos.

### Recomendación: Suspense boundary

Server Components no tienen loading state interno. Para mejor UX se recomienda:

```tsx
<Suspense fallback={<EmbedSkeleton />}>
  <TalentServiceFormEmbed slug="plomeria" siteCountryId="ar" locale="es" />
</Suspense>
```

## Reasons (discriminated union)

El embed puede no renderizar el form por 10 razones distintas. Cada una mapea a una key i18n bajo `TalentServiceEmbed.unavailable.*`:

| Reason | Cuándo | UX |
|---|---|---|
| `not-authenticated` | `auth.getUser()` retorna null | "Iniciá sesión para continuar" |
| `no-talent-profile` | User autenticado pero sin `talent_profiles` row | "Completá tu perfil de talento" |
| `talent-country-not-set` | `talent_profiles.country_id === null` | "Completá tu país antes de continuar" |
| `country-mismatch` | `talent.country_id !== siteCountryId` | "Este formulario no está disponible en tu país" |
| `unknown-slug` | `services WHERE slug = ?` retorna null | "Servicio no encontrado" (error genérico para no enumerar) |
| `service-not-active` | `services.status !== 'active'` | "Servicio no disponible" |
| `city-not-configured` | Sin variant city ni general (post-fallback) | "Formulario no disponible para tu ciudad" |
| `no-active-form` | `talent_forms.is_active = false` para todo el tuple | "Formulario no disponible" |
| `empty-schema` | Form existe pero `resolvedForm.steps` no tiene fields | "Formulario sin contenido" |
| `legacy-schema` | Schema en DB no es `CatalogFormSchema` | "Formulario en formato obsoleto" |

## Reglas de resolución (locked)

- **Identidad**: `talent_id` siempre desde session + `talent_profiles`. El client nunca lo pasa.
- **Country en submit**: derivado de `talent_profiles.country_id` post-gate. El client nunca lo pasa.
- **City en form lookup**: `talent.city_id` (puede ser null → loader hace fallback a city=null variant).
- **Country gate**: `granted: true` solo si `talent.country_id === siteCountryId` y no es null.
- **`register` action en talent forms**: refused en dos capas:
  1. **Zod en `catalog-schema-validation.ts`**: con param `kind: 'talent-service'`, rechaza al guardar el form schema.
  2. **Runtime guard en Renderer**: si llega un `meta.action === 'register'` (form viejo o malformado), downgrade a `save` + `devWarn`.
- **Auth fields en submit**: NO se filtran. `writeAuth` en edit flow es no-op si email no cambió, o `updateUser` si `allow_change=true` y cambió.
- **Service status**: `services.status` debe ser `'active'`. De lo contrario → `service-not-active`.

## Observability

En modo dev (`NODE_ENV !== 'production'`), el embed loggea con prefijo `[TalentServiceFormEmbed]`:

- Cada `unavailable` con su `reason` + `slug` + `siteCountryId`.
- `meta.action === 'register'` recibido en el Renderer (downgrade).
- Errores del server action (`_auth`, `_config`, `_db`).
- Duplicate active rows en `talent_forms` para un tuple `(service_id, city_id)`.

En prod, sólo errores fatales se loggean (default Next.js).

## Embed en public vs protected routes

El embed se comporta correctamente en cualquier route group:

- **Public route** (sin middleware auth): user no logueado ve `not-authenticated` inline. Logueado ve flow normal.
- **Protected route** (con middleware redirect): middleware redirige al login antes que el embed renderice. Si llega, el user ya está autenticado.

## Snippet copyable (admin)

```tsx
// El site tiene asignado un país. El embed resuelve country_id y city_id
// del talent autenticado desde su profile. Si el talent no está en el
// mismo país que el site, o no hay variant para su ciudad, el form
// muestra un mensaje de no-disponible en lugar de renderizar.
//
// Props:
//   slug           — requerido. El slug del servicio (services.slug).
//   siteCountryId  — requerido. El country_id del sitio donde se embebe.
//   locale         — requerido. Locale activa para traducciones.
//   onSubmit       — opcional. (data) => void | Promise<void>. Se
//                    invoca después de un save exitoso. Útil para
//                    tracking/redirect. Un error en este callback no
//                    revierte el save.
//
// Recomendado envolver con <Suspense fallback={...}> para loading UX.
<TalentServiceFormEmbed
  slug="<service.slug>"
  siteCountryId={siteCountryId}
  locale={locale}
/>
```

## Arquitectura

### Capa shared (`src/shared/lib/embed/`)

- `types.ts` — `EmbedReason` union, `EmbedResolverResult<TMeta>` discriminated union. Reusable cross-feature.
- `empty-schema-check.ts` — `isEmptySchema(resolvedForm)`, `isLegacySchema(rawJson)` helpers.
- `dev-warn.ts` — wrapper sobre `console.warn` con gate `NODE_ENV`.

### Capa feature (`src/features/talent-services/`)

**Server Actions:**
- `actions/get-embeddable-talent-form.ts` — `(slug, cityId)` → form row + service_id, con detección de `unknown-slug` / `service-not-active` / `no-active-form`.
- `actions/get-resolved-embeddable-talent-form.ts` — wrapper que añade `loadTalentFormLabels` + `resolveFormFromJson` + detect `empty-schema` / `legacy-schema`.
- `actions/resolve-talent-access.ts` — gate de country: `(userId, siteCountryId)` → `granted` | `reason`.
- `actions/submit-talent-service.ts` (modificado) — identity + country desde session, sin client input.

**Components:**
- `components/talent-service-form-embed.tsx` — Server Component wrapper, **API pública**.
- `components/talent-service-form-embed-renderer.tsx` — Client Component, implementation detail.

## Flow de submit

1. Renderer llama `submitTalentService({ service_id, form_id, form_data, resolved_form })` (sin `talent_id`, sin `country_id`).
2. La server action:
   - Resuelve `userId` desde `auth.getUser()` → si null → error `_auth: ['notAuthenticated']`.
   - Resuelve `talent_profiles WHERE user_id = ?` → si null → error `_auth: ['noTalentProfile']`.
   - `country_id` desde `talent_profiles.country_id`.
   - Valida: si schema tiene `service_select` field y `country_id === null` → error `_config: ['countryIdRequired']`.
   - Upsert `talent_services` con `(talent_id, service_id, country_id)` + `form_id`.
   - `persistFormData` con `userId = talent_id`, todos los fields (auth incluidos), `context.serviceSelect.country_id`.
3. Renderer mapea errores `_auth | _config | _db` a i18n keys → toast.
4. Si success → invoca `onSubmit?.(formData)` → toast success.

## i18n contract

15 keys en 5 locales (es, en, pt, fr, ca):

```
TalentServiceEmbed.unavailable.unknownSlug
TalentServiceEmbed.unavailable.serviceNotActive
TalentServiceEmbed.unavailable.countryMismatch
TalentServiceEmbed.unavailable.talentCountryNotSet
TalentServiceEmbed.unavailable.cityNotConfigured
TalentServiceEmbed.unavailable.noActiveForm
TalentServiceEmbed.unavailable.emptySchema
TalentServiceEmbed.unavailable.legacySchema
TalentServiceEmbed.unavailable.notAuthenticated
TalentServiceEmbed.unavailable.noTalentProfile
TalentServiceEmbed.error.auth
TalentServiceEmbed.error.config
TalentServiceEmbed.error.db
AdminTalentServices.embedCode
AdminTalentServices.embedHint
```

Anti-drift test en `src/lib/i18n/__tests__/locale-parity.test.ts` verifica que los 5 JSONs tengan exactamente el mismo set de key paths.

## Criterios de aceptación

- [ ] El snippet del admin se puede copiar y pegar en una page → renderiza el form sin código adicional.
- [ ] Talent en país correcto + city con variant → form de la variant.
- [ ] Talent en país correcto + city sin variant → fallback a general.
- [ ] Talent en país distinto → `country-mismatch` message inline (no toast).
- [ ] Talent sin country seteado → `talent-country-not-set` message.
- [ ] Visitante no autenticado en route public → `not-authenticated` message.
- [ ] User autenticado sin `talent_profiles` → `no-talent-profile` message.
- [ ] Slug inexistente → `unknown-slug`.
- [ ] Service desactivado → `service-not-active`.
- [ ] City sin variant + sin general → `city-not-configured`.
- [ ] Form sin fields → `empty-schema`.
- [ ] Schema legacy → `legacy-schema`.
- [ ] Submit con required vacío → inline error en field, no toast success.
- [ ] Submit OK → upsert en `talent_services` + persistencia de fields → toast success → `onSubmit` callback invocado.
- [ ] Form viejo con action `register` → Renderer downgrade a `save` + dev warn (no llega al backend como register).
- [ ] Zod rechaza al guardar form con action `register` en talent context.
- [ ] Email auth field con `allow_change=false` + email cambiado → error.
- [ ] Email auth field unchanged → no-op (no `updateUser`).
- [ ] Email auth field con `allow_change=true` + email cambiado → `updateUser` (link de confirmación).
- [ ] Tests anti-drift de locales pasan: 0 keys faltantes.
- [ ] `NODE_ENV=production pnpm build` verde.
- [ ] Test de aislamiento: borrar `features/general-forms/` no rompe `features/talent-services/`.

## Out of scope v1

- Geolocation / city-picker dentro del embed (`siteCountryId` lo provee el embedder).
- Preview live dentro del admin builder (el harness `/admin/test-talent-service-embed` cubre la necesidad).
- Versioning del embed (`talent_forms.version` no se expone en la API).
- Authless talent forms (signup-desde-servicio) — feature separado si surge.
- DB constraint de uniqueness activa en `talent_forms(service_id, city_id)` — sólo dev-warn por ahora.
- Multi-country talents (un talent vive en un país).
- i18n fallback 3-niveles (usa `locale → 'es'` ya existente).
- Rate limiting del submit (delegado a Supabase defaults).
- SEO metadata del embed (responsabilidad de la page que embebe).

## Cross-references

- `docs/features/talent-services.md` — schema y flujos del feature padre.
- `docs/features/registration-forms.md` — sistema paralelo de general forms.
- `architecture.md` §3 — reglas de aislamiento entre features (justifica `src/shared/lib/embed/`).

## Plan de implementación

Sesiones S0–S10 documentadas en `~/.claude/plans/abstract-brewing-glade.md`. Resumen:

| # | Entregable | Bloquea |
|---|---|---|
| S0 | Spec (este documento) | — |
| S1 | `src/shared/lib/embed/` infra | S2, S3 |
| S2 | Fix general forms embed-by-slug + rename | S6 (patrón) |
| S3 | Talent form loader by-slug | S6 |
| S4 | Talent access gate | S6 |
| S5 | Submit hardening + Zod register guard | S6 |
| S6 | Talent embed (Server + Client) | S7, S8 |
| S7 | Portal migration + delete renderer | S8 |
| S8 | Admin tab Configuración | S9 |
| S9 | i18n + anti-drift test | S10 |
| S10 | Harness + e2e walkthrough | — |
