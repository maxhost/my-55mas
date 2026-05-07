# Talent search modal v2 (admin → orden → especialistas)

Mejora del modal "Añadir talento" en `/admin/orders/[id]` tab Especialistas.
Reemplaza la lista plana actual por: loader + filtros con pre-fill + filas
acordeón + botón Seleccionar por fila.

## Goal

1. **Loader** mientras la action está pendiente (la query toca varias tablas
   y puede demorar).
2. **Filtros** (no solo búsqueda): país, ciudad, código postal, servicio.
   Pre-fill: country/city/postal/service de la orden activa.
3. **Botón "Limpiar filtros"** que vuelve la lista a sin filtros (todos los
   talents activos).
4. **Filas acordeón**: header colapsado muestra Nombre + rating + botón
   Seleccionar. Click en el nombre expande info adicional (país, ciudad,
   código postal, servicios que ofrece). Email/teléfono dejan de mostrarse
   en la lista.
5. **Postal code opcional**: si el talent no tiene postal, no se oculta —
   se muestra "—" en el detalle expandido.

## Out of scope

- Paginación server-side. La cantidad de talents activos no justifica
  paginación todavía (y la búsqueda por nombre + filtros reduce
  rápidamente). Si el dataset crece > 200, agregamos en otra sesión.
- Filtro por rating o por completed_count. Hoy se usan solo para el
  ordenamiento.
- Multi-select en filtros. Por ahora cada filtro es single value (igual
  que el listado de orders).

## Layout

```
┌──────────────────────────────────────────────────────┐
│ Buscar talento                                      X│
├──────────────────────────────────────────────────────┤
│ [Search por nombre…                              ]   │
│                                                      │
│ Filtros: [País▼] [Ciudad▼] [Postal] [Servicio▼]      │
│           ⟲ Limpiar filtros                          │
├──────────────────────────────────────────────────────┤
│ ▶ Maxi Ogas              ★ 4.5  6 servicios  [Selec.]│
│   [Calificado]                                       │
│ ─────────────────────────────────────────────────── │
│ ▼ Carmen Ruiz            ★ 4.8  31 servicios [Selec.]│
│   País: España                                       │
│   Ciudad: Barcelona                                  │
│   Código postal: 08036                               │
│   Servicios registrados: 4                           │
│ ─────────────────────────────────────────────────── │
│ ▶ ...                                                │
│                                                      │
│ (loader mientras pending: spinner + texto "Cargando")│
└──────────────────────────────────────────────────────┘
```

## Decisiones de diseño tomadas

1. **Pre-fill de filtros desde la orden** (al abrir el modal):
   - País → `order.country_id` (para el modal recibirá del componente padre).
   - Ciudad → `order.service_city_id`.
   - Postal → `order.service_postal_code` (puede ser null/empty → omitir).
   - Servicio → `order.service_id`.
   La intención: por default mostrar talents que coinciden con la orden;
   admin amplía con "Limpiar filtros" si necesita.

2. **`postal_code` viene de `profiles.address->>postal_code` jsonb**. Si el
   talent no tiene postal cargado, queda string vacío — la fila se muestra
   igual con "—" en el detalle. Filtro por postal usa `LIKE` exacto
   (case-insensitive) — admin puede borrar el filtro si excluye demasiados.

3. **Filtro por servicio** = talents con un row en `talent_services` para
   ese `service_id` (sin importar country, porque el filtro de country ya
   maneja eso). Si filtro country está vacío, traemos talents que ofrecen
   ese servicio en cualquier país.

4. **Acordeón con un solo open a la vez** (mismo patrón que `SectionShell`
   del details tab pero más simple — no hay edit mode).

5. **Loader visible**: mientras `useTransition` está pendiente, oculta
   resultados y muestra "Cargando…" + un spinner Lucide. No mostramos
   skeleton de filas (la cantidad varía con filtros — un spinner único
   es más predecible).

6. **Botón "Limpiar filtros"** vuelve a `{ countryId: null, cityId: null,
   postalCode: '', serviceId: null, query: '' }`. NO usa los pre-fills
   (la intención del usuario al limpiar es ver todo). Si quiere volver al
   pre-fill, cierra el modal y reabre.

7. **`is_qualified` sigue mostrándose con badge "Calificado"** cuando
   aplica (lógica server-side actual). Útil cuando el admin abre con
   filtros limpios pero quiere identificar a los registrados oficialmente.

## Modelo de datos extendido

`TalentSearchResult` agrega:
```ts
{
  // existing
  id, user_id, full_name, email, phone, rating_avg, completed_count, is_qualified,
  // NEW
  country_id: string | null;
  country_name: string | null;
  city_id: string | null;
  city_name: string | null;
  postal_code: string | null;       // from profiles.address jsonb
  registered_services_count: number; // count of talent_services rows for this talent
}
```

`email` y `phone` dejan de mostrarse en la lista pero se mantienen en el
type (para mantener el contrato estable; futuras vistas podrían querer
verlos).

## Action contract

```ts
export type TalentSearchFilters = {
  countryId: string | null;
  cityId: string | null;
  postalCode: string | null;        // exact-prefix match, empty string = no filter
  serviceId: string | null;
  query: string;                    // searches full_name (case-insensitive)
};

export async function getTalentSearchResults(
  orderId: string,
  filters: TalentSearchFilters,
  locale: string,
): Promise<TalentSearchResult[]>;
```

Cambio de signature: ahora toma un objeto de filtros + locale (necesario
para localizar country_name y city_name).

**Filtrado server-side** (en orden):
1. Excluir status archived/excluded/inactive.
2. Excluir talents ya asignados a la orden.
3. Si `countryId` → `talent_profiles.country_id = countryId`.
4. Si `cityId` → `talent_profiles.city_id = cityId`.
5. Si `serviceId` → JOIN `talent_services` filtrando por `service_id`.
6. Aplicar JS post-filter:
   - Si `postalCode.trim() !== ''` → `profiles.address->postal_code ilike '${postalCode}%'`.
   - Si `query.trim() !== ''` → `full_name ilike '%${query}%'`.
   (Postal y query se aplican post-fetch porque ambos requieren JSONB y
   pueden combinarse fácilmente en JS sin perder claridad.)
7. Compute `is_qualified` (talent_services para service_id+country_id de la orden).
8. Compute `registered_services_count` (count distinct service_id en
   talent_services del talent).
9. Sort: qualified → rating DESC → completed DESC → name ASC.

## Estructura de archivos

**Modificados** (orquestador):
- `src/features/orders/detail/types.ts`: extender `TalentSearchResult`,
  extender `SpecialistsTabHints` con nuevas keys, definir nuevos types
  `TalentSearchFilters`, `TalentSearchFiltersHints`, `TalentSearchRowHints`.
- `src/features/orders/detail/schemas.ts`: Zod para los filtros.
- `src/features/orders/detail/actions/get-talent-search-results.ts`:
  rewrite con filtros + datos extendidos.
- `src/lib/i18n/messages/{es,en,pt,fr,ca}.json`: agregar keys del namespace
  `AdminOrderDetail.specialists`.
- `src/app/[locale]/(admin)/admin/orders/[id]/page.tsx`: extender
  `readSpecialists` con las nuevas keys.
- `src/features/orders/detail/components/tabs/specialists/search-talent-modal.tsx`:
  rewrite (ensamble final, integra filters + row + loader).

**Nuevos** (agentes paralelos):
- `src/features/orders/detail/components/tabs/specialists/talent-search-filters.tsx`
  (Agent A — filter bar).
- `src/features/orders/detail/components/tabs/specialists/talent-search-row.tsx`
  (Agent B — accordion row).

Cada agente solo crea su archivo. Cero overlap.

## Contratos de Props para los agentes

### TalentSearchFilters (Agent A)

```ts
import type {
  TalentSearchFilters,
  TalentSearchFiltersHints,
  CountryRef,    // existing in types.ts
  CityRef,       // existing
} from '@/features/orders/detail/types';

type ServiceOption = { id: string; name: string };

type Props = {
  values: TalentSearchFilters;
  onChange: (next: TalentSearchFilters) => void;
  onClear: () => void;
  countries: CountryRef[];
  cities: CityRef[];           // unfiltered; component filters by country
  services: ServiceOption[];
  hints: TalentSearchFiltersHints;
};
```

`TalentSearchFiltersHints`:
```ts
{
  searchPlaceholder: string;
  filtersLabel: string;
  filterCountry: string;
  filterCity: string;
  filterPostalCode: string;
  filterService: string;
  postalCodePlaceholder: string;
  clearFilters: string;
  notProvided: string;        // SelectValue placeholder fallback
}
```

Behavior:
- 4 Selects + 1 Input (postal code) + 1 Input (search) + 1 Button (clear).
- City Select disabled cuando no hay country seleccionado.
- Cuando country cambia → reset cityId a null.
- Selects usan render-prop en `<SelectValue>` para resolver value→label
  (gotcha #1 del pattern doc).
- `__none__` sentinel para representar "sin filtro" en los Selects.
- Clear button con icono Lucide `RotateCcw`.

### TalentSearchRow (Agent B)

```ts
type Props = {
  talent: TalentSearchResult;
  expanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  selecting: boolean;          // disables the Select button while pending
  hints: TalentSearchRowHints;
};
```

`TalentSearchRowHints`:
```ts
{
  selectButton: string;
  qualifiedBadge: string;
  reviewsCount: string;        // "([count] reviews)"
  servicesCount: string;       // "[count] servicios" — for inline summary
  expandLabel: string;
  collapseLabel: string;
  detailCountryLabel: string;
  detailCityLabel: string;
  detailPostalCodeLabel: string;
  detailRegisteredServicesLabel: string;
  notProvided: string;
}
```

Behavior:
- Header colapsado: ChevronDown rotated cuando expanded; nombre + Badge
  "Calificado" si `is_qualified`; rating con `★ N.N (count reviews)` o
  `★ —` si `rating_count === 0`; texto "{servicesCount}"; botón Seleccionar
  a la derecha.
- Click en TODA la fila (excepto el botón) toggle expand.
- Body expandido: 4 filas label/value con país, ciudad, postal, servicios
  registrados. "—" cuando null/empty.
- Botón Seleccionar: variant="default", size="sm". Si `selecting`,
  disabled.

## i18n keys nuevas

Namespace `AdminOrderDetail.specialists` recibe ~16 nuevas keys (mostradas
arriba en `TalentSearchFiltersHints` + `TalentSearchRowHints` + algunas
del modal mismo: `loading`, etc.). 5 locales × ~16 = ~80 strings nuevas.

## Workflow

1. **Foundation (orquestador, secuencial)**:
   a. Extender types.
   b. Update schemas.
   c. Rewrite `get-talent-search-results.ts`.
   d. Agregar i18n keys en 5 locales.
   e. Update `page.tsx readSpecialists`.

2. **2 agentes paralelos** (independientes, ningún archivo compartido):
   - Agent A → `talent-search-filters.tsx`.
   - Agent B → `talent-search-row.tsx`.

3. **Integración (orquestador)**:
   - Rewrite `search-talent-modal.tsx` para usar los 2 nuevos componentes.
   - Manage `filters` state, `expandedTalentId` state, loader.
   - Pre-fill al abrir (recibe defaults de la orden por prop).

4. **Verify**: typecheck, tests, build, smoke mental.

5. **Commit**.

## Riesgos

- **`profiles.address` jsonb** puede venir con shape inesperado (legacy
  data). Defender: leer `address?.postal_code as string | undefined ?? null`.
- **Filtros muy restrictivos al pre-fill** podrían dejar lista vacía
  (ej: ciudad de la orden no tiene talents). El usuario tiene que clickear
  "Limpiar filtros". Documentar esto vía empty state mensaje claro.
- **Pre-fill con `service_id` sin cualquier match** — si ningún talent
  tiene `talent_services` para ese servicio, lista vacía. Mismo escape:
  Limpiar filtros.
- **Performance**: post-filter por postal+query en JS. Para datasets
  pequeños (< 500 talents) está bien. Si crece, mover a query SQL.

## Verificación end-to-end

1. `pnpm exec tsc --noEmit` clean.
2. `pnpm test` clean (360+).
3. `NODE_ENV=production pnpm build` clean.
4. Smoke (mental):
   - Abrir modal → loader visible → resultados pre-filtrados (con Maxi).
   - Click en una fila → se expande con país, ciudad, postal, servicios.
   - Click "Limpiar filtros" → resultados vuelven sin filtros.
   - Search por "Maxi" → solo Maxi.
   - Botón "Seleccionar" → asigna y cierra modal.
