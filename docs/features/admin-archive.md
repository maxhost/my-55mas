# Archivo de pedidos (admin)

Página `/admin/archive` y `/admin/archive/[id]` — vista del archivo de
pedidos cerrados. Funcionalmente idéntico a `/admin/orders` y
`/admin/orders/[id]`, pero **scopeado a status `archivado` o `terminado`**.

## Goal

1. `/admin/archive` muestra el listado con la misma tabla y filtros que
   `/admin/orders`, restringido a 4 status: `archivado`, `terminado`,
   `cancelado`, `rechazado`. El filtro de status del toolbar se mantiene
   pero acotado a esos 4 valores.
2. `/admin/archive/[id]` abre el detalle con el mismo `OrderDetailTabs`
   pero en **modo read-only** mientras el status sea uno de los 4. El
   admin solo puede editar el Select de status del header (única salida
   del modo read-only). Si cambia status a un valor fuera del archive
   set, refrescar saca la orden del archive y devuelve `notFound()`.
3. La sidebar ya tiene la entrada `archive` apuntando a `/admin/archive` —
   solo falta crear las páginas.

## Out of scope

- Bulk delete / export. Out of scope.
- Redirect automático a `/admin/orders/[id]` cuando el admin cambia el
  status fuera del archive set. Por ahora `notFound()` al refrescar
  (estricto). Si el usuario lo pide, agregamos redirect en otra sesión.

## Decisiones de diseño tomadas

1. **4 status que cuentan como "archivo"**: `archivado`, `terminado`,
   `cancelado`, `rechazado`. Constante `ARCHIVE_STATUSES` exportada desde
   `src/features/orders/types.ts`.
2. **Filtro de status visible en el toolbar de archive** PERO acotado a
   los 4 valores de `ARCHIVE_STATUSES`. El resto de filtros (país, ciudad,
   talent, cliente, fechas, search) funciona igual.
3. **Listing reutiliza `OrdersList`** con prop `statusOptions?:
   OrderStatus[]` (cuando se pasa, el toolbar limita las opciones del
   Select; default = todos los status). Cero duplicación de UI.
4. **Detail reutiliza `OrderDetailTabs`** con prop `readOnly?: boolean`.
   Cuando true, todos los controles de edición se ocultan EXCEPTO el
   Status Select del header (única salida del modo). La página
   `archive/[id]/page.tsx` valida el status de la orden ANTES de renderizar;
   si la orden no es archive-eligible, llama `notFound()`.
5. **Back link**: en `/admin/archive/[id]`, el botón "Volver al listado"
   apunta a `/admin/archive` (no a `/admin/orders`). Label
   `AdminArchive.backToList` ("Volver al archivo").
6. **Order number link** en la tabla: prop nuevo `linkBasePath` en
   `orders-table.tsx`. Default `/admin/orders/`; archive pasa
   `/admin/archive/`. Cero condicionales en el componente.
7. **Helper extraído**: el `page.tsx` actual del detalle de orders es 345
   LOC, en su mayoría `read*(t)` para resolver hints. Refactor: extraer
   `loadOrderDetailPageData(id, locale)` a `src/features/orders/detail/lib/`
   que devuelve un objeto listo para pasar a `OrderDetailTabs`. Las páginas
   de detalle (orders y archive) quedan en ~30 LOC cada una.
8. **Read-only mode propagation**: `OrderDetailTabs` recibe `readOnly` y
   propaga a cada tab hija via prop. Cada tab (`OrderHeader`, `ServiceTab`,
   `SpecialistsTab`, `HoursTab`, `BillingTab`, `ActivityTab`) respeta el
   flag escondiendo sus respectivos botones de edición. Documents queda
   igual (ya es read-only). El status Select del header se mantiene
   editable porque ese es el mecanismo para sacar la orden del archive.

## Modelo de datos

Sin cambios. La acción `listOrders` ya filtra por status; solo extender
para aceptar `statuses?: OrderStatus[]` opcional.

## Estructura de archivos

**Modificados** (orquestador):

1. `src/features/orders/actions/list-orders.ts` — param opcional `statuses`.
2. `src/features/orders/components/orders-toolbar.tsx` — prop
   `hideStatusFilter?: boolean`. Cuando true, el bloque del Select de
   status NO se renderiza. La columna queda sin ese control.
3. `src/features/orders/components/orders-list.tsx` — prop
   `hideStatusFilter?: boolean`, propaga al toolbar. Cuando true, el state
   `statusFilter` se ignora (se mantiene en `'all'`).
4. `src/features/orders/components/orders-table.tsx` — prop opcional
   `linkBasePath?: string` (default `'/admin/orders/'`). Construye href
   como `${locale}/${linkBasePath}${order.id}` correctamente (locale ya
   se inyecta vía useLocale).
5. `src/app/[locale]/(admin)/admin/orders/[id]/page.tsx` — refactor para
   usar el nuevo helper.
6. `src/lib/i18n/messages/{es,en,pt,fr,ca}.json`:
   - Nuevo namespace `AdminArchive`: `title`, `description` (subline),
     `noArchive` (empty state).
   - Nueva key `AdminOrderDetail.archiveBackToList`: "Volver al archivo".

**Nuevos** (agentes paralelos):

1. `src/features/orders/detail/lib/load-order-detail-page-data.ts` (en
   realidad este lo crea el orquestador como parte de Foundation, no los
   agentes — es shared infra).
2. `src/app/[locale]/(admin)/admin/archive/page.tsx` (Agent A — listing).
3. `src/app/[locale]/(admin)/admin/archive/[id]/page.tsx` (Agent B —
   detail).

Cero overlap entre agentes A y B: cada uno crea un archivo nuevo en un
directorio distinto. Ambos consumen la foundation que el orquestador
preparó.

## Foundation que el orquestador prepara (paso a paso)

### F1: extender `listOrders`

```ts
// src/features/orders/actions/list-orders.ts
type ListOrdersParams = {
  locale: string;
  statuses?: OrderStatus[];   // NEW
};

export async function listOrders({ locale, statuses }: ListOrdersParams) {
  // ... existing logic
  let q = supabase.from('orders').select(...);
  if (statuses && statuses.length > 0) {
    q = q.in('status', statuses);
  }
  // ...
}
```

### F2: extender `orders-toolbar.tsx`

```ts
type Props = {
  // ... existing
  hideStatusFilter?: boolean;  // NEW
};

// In render:
{!hideStatusFilter && (
  <Select value={statusFilter} ...>...</Select>
)}
```

### F3: extender `orders-list.tsx`

```ts
type Props = {
  // ... existing
  hideStatusFilter?: boolean;  // NEW
};

// Propagate to toolbar; statusFilter state stays 'all' if hidden:
const effectiveStatusFilter = hideStatusFilter ? 'all' : statusFilter;
// And the filtered useMemo uses effectiveStatusFilter.
```

### F4: extender `orders-table.tsx`

```ts
type Props = {
  orders: OrderListItem[];
  linkBasePath?: string;       // NEW, default '/admin/orders/'
};

const linkBase = linkBasePath ?? '/admin/orders/';
// In the row:
<Link href={`/${locale}${linkBase}${order.id}`}>...
```

(Note: ya tiene `useLocale()`. El path es `/${locale}${linkBase}${id}`.)

### F5: helper `loadOrderDetailPageData`

```ts
// src/features/orders/detail/lib/load-order-detail-page-data.ts
export type LoadResult = {
  order: OrderDetail;
  initialServiceData: ServiceTabData;
  initialServiceContext: ServiceTabContext;
  initialAssigned: AssignedTalent[];
  initialTalentSearchContext: TalentSearchContext;
  initialHours: HoursTabData;
  initialBilling: BillingTabData;
  initialDocuments: OrderDocumentEntry[];
  initialActivity: OrderActivityNote[];
  availableTags: OrderTagOption[];
  hints: OrderDetailHints;
};

export async function loadOrderDetailPageData(
  id: string,
  locale: string,
  t: T,
): Promise<LoadResult | null>;
```

Devuelve `null` si la orden no existe (page llama `notFound()`).

### F6: refactor `orders/[id]/page.tsx` para usar el helper

El page queda ~30 LOC: load + notFound + render + back link.

### F7: i18n

Nuevo namespace `AdminArchive`:
```json
{
  "title": "Archivo",
  "description": "Pedidos archivados o terminados.",
  "noArchive": "No hay pedidos archivados."
}
```

Y key `AdminOrderDetail.archiveBackToList`: "Volver al archivo".

## Slices paralelos

### Agent A — `archive/page.tsx`

**File**: `src/app/[locale]/(admin)/admin/archive/page.tsx`

**Goal**:
- Server component.
- Llama `listOrders({ locale, statuses: ['archivado', 'terminado'] })`.
- Llama getCountryOptions, getCityOptions, getTalentOptions,
  getClientOptions (igual que orders).
- Renderiza `<PageHeader title={t('title')} />` con namespace `AdminArchive`.
- Renderiza `<OrdersList>` con prop `hideStatusFilter`.
- **NUEVA prop** que también necesita: `linkBasePath="/admin/archive/"`.
  Esa prop la propaga `orders-list` → `orders-table`. El agente debe
  agregar este prop a `OrdersList` también si no está... NO. Eso lo hace
  el orquestador en F3.

**Props chain (a verificar)**: `OrdersListProps.hideStatusFilter` y
`OrdersListProps.linkBasePath` → ambas se propagan al toolbar/table.

**Dependencias**: Solo consume actions y componentes del feature
`orders/`. No toca `OrderDetailTabs`.

### Agent B — `archive/[id]/page.tsx`

**File**: `src/app/[locale]/(admin)/admin/archive/[id]/page.tsx`

**Goal**:
- Server component.
- Llama `loadOrderDetailPageData(id, locale, t)`.
- Si retorna null O `data.order.status` no está en `['archivado',
  'terminado']`, llama `notFound()`.
- Renderiza el back link a `/admin/archive` con label
  `t('header.archiveBackToList')` (o sea AdminOrderDetail).
- Renderiza `<OrderDetailTabs>` con todos los initial* de `data` y los
  `hints`.

**Dependencias**: Consume el helper que el orquestador crea en F5.

## i18n keys nuevas

5 keys × 5 locales = 25 strings:
- `AdminArchive.title`
- `AdminArchive.description`
- `AdminArchive.noArchive`
- `AdminOrderDetail.header.archiveBackToList` (o como key separada en
  archive — voy con la misma de AdminOrderDetail por proximidad).

Wait — el back link no está en `OrderDetailTabs`, está en el page.tsx
mismo. El back link de orders usa `t('backToList')` del namespace
`AdminOrderDetail`. Para archive, podemos hacer:
- Opción A: agregar `AdminOrderDetail.archiveBackToList`.
- Opción B: usar `AdminArchive.backToList` (más localizado al feature).

Voy con B (más limpio). Total i18n keys nuevas: 4 en `AdminArchive`
(title, description, noArchive, backToList).

## Riesgos

- **Mismo componente para listing/detail** = un cambio futuro en
  `OrdersList` o `OrderDetailTabs` afecta ambos. Bien semánticamente
  (queremos que se mantengan iguales), pero anotar para regression tests
  futuros.
- **`OrderDetailTabs` permite editar** desde archive: si el admin cambia
  el status de una orden archivada a "asignado" desde el header, el
  refetch carga la orden ya con status no-archive y al refrescar la
  página `/admin/archive/[id]/...` saca `notFound()`. Esto es UX
  inesperado — el admin perdió el pinpoint. Mitigación opcional Phase 2:
  redirect a `/admin/orders/[id]` en lugar de 404 cuando el status sale
  del rango archive. Por ahora, dejamos `notFound()` para que sea estricto;
  si el usuario reporta, redirect.
- **`linkBasePath` en orders-table**: pequeño riesgo de regresión en
  /admin/orders si la default no se aplica bien. Mitigación: TypeScript
  required para callers nuevos, default explícito a `/admin/orders/`.

## Verificación end-to-end

1. `pnpm exec tsc --noEmit` clean.
2. `pnpm test` clean (360+).
3. `NODE_ENV=production pnpm build` clean.
4. Smoke (mental):
   - `/es/admin/archive` carga. Ve la orden #1042 (porque es status
     `terminado`). NO ve el filtro de status en el toolbar.
   - Click en el order_number → va a `/es/admin/archive/[id]`.
   - Detail carga con todas las tabs. Back link "Volver al archivo".
   - `/es/admin/archive/<order-id-no-archive>` → 404.
5. `/es/admin/orders` sigue funcionando igual (regresión).
