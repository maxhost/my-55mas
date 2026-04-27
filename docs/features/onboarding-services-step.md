# Feature: Onboarding step 3 — multiselect + acordeón de servicios

## Propósito

En el form de onboarding del talent (`registration_forms.slug='onboarding-talento'`), step 3 ("Servicios") permite al talent simultáneamente:

1. **Editar la selección** de servicios que ofrece (multiselect "Tipo de servicios").
2. **Configurar cada servicio elegido** con su precio, specializations, etc., usando el form embed específico del talent_form de cada servicio.
3. **Avanzar al siguiente step** sólo cuando todos los servicios elegidos tienen configuración guardada.

El multiselect y los embeds están en una sola página y deben mantenerse coherentes: agregar un servicio aparece como nuevo item en el acordeón; quitarlo lo saca; cada item tiene su propio botón de guardado.

## Contexto del talent: country + city

El talent tiene `talent_profiles.country_id` y `city_id`. Toda la lógica respeta este contexto:

- **Multiselect**: muestra solo servicios que cumplen `(services.status='published' AND service_countries.country_id=talent.country_id AND service_cities.city_id=talent.city_id)`.
- **Acordeón**: filtra los rows de `talent_services` por el mismo criterio. Rows fuera de filtro se **silent-skip** — no renderean, no cuentan en el badge `X/N guardados`, no bloquean "Siguiente". El row queda intacto en DB (si el servicio se reactiva, vuelve a aparecer).
- **Commit del multiselect**: server-side rechaza serviceIds que no están disponibles para `(country, city)` con error `_config: ['serviceNotAvailable']`.

## Diagrama de composición

```
┌──────────────────────────────────────────────────────────────┐
│ Page: /(talent)/onboarding/                                  │
│  - Resuelve talentId, countryId, cityId server-side          │
│  - Pasa serviceFilter al RegistrationFormEmbed               │
│                                                               │
│  <RegistrationFormEmbed                                      │
│    slug="onboarding-talento"                                 │
│    serviceFilter={{ countryId, cityId }}                     │
│    fieldSlots={{                                              │
│      'Servicios': {                                           │
│        'tipo_de_servicios': ({ value }) => (                 │
│          <>                                                   │
│            <TalentServiceSelectionCommitter                  │
│              fieldKey="tipo_de_servicios"                    │
│              persistedSelection={persistedSelection} />      │
│            <TalentServicesAccordion                          │
│              talentId siteCountryId={countryId}              │
│              cityId locale />                                 │
│          </>                                                  │
│        )                                                      │
│      }                                                        │
│    }}                                                         │
│    actionGuards={{                                            │
│      'Servicios': () => guardSavedAll()                      │
│    }}                                                         │
│  />                                                           │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│ FormRenderer (Client)                                        │
│  Step 3:                                                      │
│   ┌────────────────────────────────────────┐                 │
│   │ [multiselect] Tipo de servicios        │  ← field normal │
│   │   [☑ A]  [☑ B]  [☑ C]  [☐ D]          │                 │
│   ├────────────────────────────────────────┤                 │
│   │ Slot:                                   │                 │
│   │  [Aplicar selección] (disabled si =)   │  ← committer    │
│   │  ┌────────────────────────────────┐    │                 │
│   │  │ ▼ Servicio A — Pendiente       │    │  ← accordion    │
│   │  │   <TalentServiceFormEmbed/>    │    │                 │
│   │  │   [Guardar]                     │    │                 │
│   │  ├────────────────────────────────┤    │                 │
│   │  │ ▶ Servicio B — Guardado ✓      │    │                 │
│   │  ├────────────────────────────────┤    │                 │
│   │  │ ▶ Servicio C — Pendiente       │    │                 │
│   │  └────────────────────────────────┘    │                 │
│   ├────────────────────────────────────────┤                 │
│   │ [Volver]   [Siguiente] (3/3 guardados) │  ← actionGuard  │
│   └────────────────────────────────────────┘                 │
└──────────────────────────────────────────────────────────────┘
```

## Reglas de identidad y contexto

- `talentId`, `countryId`, `cityId` siempre se resuelven **server-side** desde la sesión + `talent_profiles`. El cliente nunca los pasa.
- El page component lee estos valores con `auth.getUser()` + `talent_profiles WHERE user_id=?`.
- El server action `commitTalentServiceSelection` también los resuelve internamente (no acepta talentId del input).

## Action contracts

### `getTalentServicesStatus(): Promise<{ services, saved, total, countryId, cityId }>`

- Identidad server-side.
- Query JOIN con filtro `(country_id, city_id, status='published')`.
- Retorna solo servicios disponibles para el talent (silent-skip de inactivos/no-disponibles).
- `services: [{ serviceId, slug, label, hasFormData }]`.
- `saved = count where hasFormData`. `total = services.length`.

### `commitTalentServiceSelection({ serviceIds }): Promise<{ data: { count } } | { error }>`

- Identidad server-side.
- Valida cada serviceId: si alguno no está en la lista de disponibles para `(countryId, cityId)`, retorna `{ error: { _config: ['serviceNotAvailable'] } }`.
- Llama `writeServiceSelect` (idempotente diff-based post-S1).
- `revalidatePath('/[locale]/(talent)', 'layout')`.

## Comportamiento de re-elección

- **Idéntica selección**: adapter diff-based detecta `toAdd=[]` y `toRemove=[]` → 0 inserts, 0 deletes. **`form_data` preservado**.
- **Agregar servicio nuevo (D)**: insert único. Otros servicios intactos.
- **Quitar servicio (B)**: delete único. **`form_data` de B se pierde** (cascade). Otros intactos.
- **Cambio mixto (quitar B + agregar D)**: solo el diff. A y C intactos.

Re-elección destructiva en lo sacado es la estrategia decidida (UX confirmada por user). Soft-delete con preservación queda fuera de scope v1.

## UX states del committer

| Estado del multiselect | Botón "Aplicar selección" |
|---|---|
| Igual a `persistedSelection` (no hay diff) | **Disabled**, sin texto extra |
| Difiere de `persistedSelection` | **Enabled**, label "Aplicar selección" |
| Click → in-flight | Disabled, label "Aplicando…" |
| Success | Toast "Selección aplicada", botón vuelve a disabled |
| Error (incluye `serviceNotAvailable`) | Toast con mensaje, botón habilitado para reintentar |

## Status badges del acordeón

- **"Pendiente"**: `talent_services.form_data IS NULL`.
- **"Guardado ✓"**: `form_data IS NOT NULL`.

Update: cuando el embed de un item dispara `submitTalentService`, el server action ya hace `revalidatePath`. El acordeón (Server Component) re-renderea con el nuevo status.

## Bloqueo del "Siguiente"

`actionGuards['Servicios']` en el FormRenderer:

```ts
() => {
  if (status.total === 0) return tEmbed('atLeastOneService');
  if (status.saved < status.total) return tEmbed('saveAllServicesFirst');
  return true;
}
```

Si retorna string → mensaje inline + botón "Siguiente" disabled.

**Defense-in-depth**: `saveRegistrationStep` (server-side) también valida `saved===total` antes de avanzar. Aunque el client se manipule, el server rechaza.

## Edge cases

| Edge case | Handling |
|---|---|
| 0 servicios elegidos | actionGuard bloquea con `atLeastOneService` |
| Talent sin `country_id` | El embed/page muestra mensaje "completá tu país"; cubierto por `resolveTalentAccess` |
| Talent sin `city_id` | OK — filtrado por country solo si city es null. Servicios con `service_cities` vacío no se muestran |
| Servicio inactivado mid-flow | Silent-skip; row de talent_services preservado |
| Servicio reactivado después | Reaparece en multiselect + acordeón con form_data intacto |
| Talent con form_data en row pero servicio ya no disponible | Silent-skip; el row queda en DB no rendereado |
| Talent intenta commit serviceId no disponible (DevTools tampering) | Server rechaza con `serviceNotAvailable` |
| Re-commit idéntico | Adapter no toca DB; form_data intacto |
| Talent_form sin variant para la city | Embed muestra `city-not-configured` o fallback (gestionado en S6 del feature embed) |
| 2 talents simultáneos editando el mismo profile | Out of scope; cada session opera independientemente |

## Criterios de aceptación

- [ ] Multiselect en step 3 muestra solo servicios `published + country + city`.
- [ ] Selección persistida muestra los chips correctamente al cargar.
- [ ] Botón "Aplicar selección" aparece deshabilitado si no hay diff.
- [ ] Toggle del multiselect activa el botón.
- [ ] Click "Aplicar" persiste vía adapter idempotente; form_data de servicios untocados se preserva.
- [ ] Acordeón refleja la lista actual de talent_services del talent (filtrada).
- [ ] Cada item del acordeón muestra `<TalentServiceFormEmbed slug=... siteCountryId=... locale=... />` correcto.
- [ ] Status badge correcto por item (`form_data IS NOT NULL` → "Guardado ✓").
- [ ] Submit de un embed individual actualiza el badge sin recargar la página (vía router.refresh post-revalidatePath).
- [ ] "Siguiente" bloqueado si `saved < total` o `total === 0`.
- [ ] "Siguiente" habilitado cuando `saved === total > 0`.
- [ ] Defense-in-depth: server rechaza submit del step si la condición no se cumple.
- [ ] Server rechaza commit con serviceId no disponible (`serviceNotAvailable`).
- [ ] `pnpm test` verde, `pnpm lint` clean, `NODE_ENV=production pnpm build` verde.
- [ ] `locale-parity.test.ts` verde con keys nuevas en 5 locales.
- [ ] Walkthrough manual de S9 cumple los 11 pasos sin regresiones.

## Out of scope v1

- URL-per-step routing del onboarding wizard.
- Multi-country talents.
- Soft-delete con preservación de form_data en re-elección destructiva.
- Lazy-mount per accordion item.
- Confirmation modal antes de quitar un servicio con form_data.
- Live polling del badge `X/N guardados`.
- SEO metadata de la onboarding page.

## Cross-references

- `docs/features/talent-services.md` — sistema de talent_forms.
- `docs/features/talent-service-embed.md` — embed by-slug.
- `docs/features/registration-forms.md` — sistema general forms.
- `docs/features/field-catalog.md` — service_select adapter.
- Plan: `~/.claude/plans/abstract-brewing-glade.md` (10 sesiones).
