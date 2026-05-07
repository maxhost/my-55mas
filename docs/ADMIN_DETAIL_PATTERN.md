# Patrón de página de detalle (admin)

Pattern reutilizable para construir páginas admin que muestren una entidad en
profundidad (talent, client, order, etc.). Documenta el layout, los contratos
de props, la organización de archivos y las trampas que ya pisamos.

> Implementación canónica: `/admin/talents/[id]` — todos los snippets citan
> archivos reales bajo `src/features/talents/detail/`. PATTERNS.md cubre lo
> básico (server action, server component, etc.); este doc complementa con la
> arquitectura específica de un detail page.

## Cuándo usarlo

Aplica a páginas admin que muestran **una sola entidad** con varios aspectos
para visualizar/editar (resumen + tabla relacionada + edición de campos +
timeline de notas, etc.). NO aplica a listados (`/admin/talents`), wizards de
onboarding ni formularios de creación.

Si tu pantalla cabe en 2 secciones simples, usa un `<Card>` plano. Si tienes
≥4 aspectos disjuntos (datos, pedidos, pagos, documentos, notas...), seguí
este patrón.

## Layout: Alternativa C (sticky header + highlights + tabs)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Back to <list>                                                          │
│                                                                           │
│ ┌────┐  Entity Name             [● Status] [Update Status] ← header       │
│ │ AV │  subline · subline · subline                                       │
│ │56px│  [tag] [tag] [+ manage]                                            │
│ └────┘                                                                   │
├──────────────────────────────────────────────────────────────────────────┤
│  Stat 1   |   Stat 2   |   Stat 3   |   Stat 4              ← highlights │
├──────────────────────────────────────────────────────────────────────────┤
│ [Tab1] [Tab2] [Tab3] [Tab4] [Tab5] [Tab6]                  ← tabs        │
├──────────────────────────────────────────────────────────────────────────┤
│  Contenido del tab activo (scrollable)                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

Por qué este layout y no otro:
- **Header sticky con avatar + nombre + status badge + botón primario**:
  identidad de la entidad siempre visible mientras el admin scrollea cualquier
  tab.
- **Status como botón explícito, no badge clickeable**: cambiar status es una
  acción crítica (afecta asignaciones futuras). Fricción intencional.
- **Highlights row inline (no cards)**: 4 stats máx, separadores `|`. Ocupa
  ~40px. Cards desperdician 200px en algo que es metadata.
- **Tabs horizontales ordenadas por frecuencia de uso**: el tab default es
  el más operativo (en talents = "Pedidos").

## Jerarquía de componentes

```
src/app/[locale]/(admin)/admin/<entity>/[id]/page.tsx     ← server component
└── <EntityDetailTabs> (client orchestrator)
    ├── <EntityHeader>
    │   ├── <StatusBadge>
    │   ├── <EntityTagsDisplay>
    │   └── <UpdateStatusModal>      (Sheet)
    ├── <HighlightsRow>
    └── <Tabs>                       (shadcn base-nova)
        ├── <TabsContent value="orders">    → <OrdersTab>
        ├── <TabsContent value="payments">  → <PaymentsTab>
        └── ... un componente por tab
```

Ver `src/features/talents/detail/components/talent-detail-tabs.tsx:114-188`
para el orchestrator real.

## Patrones clave

### 1. Hints contract (i18n como props, NO `useTranslations` en componentes hijos)

Cada componente cliente recibe sus strings i18n vía un objeto `hints` tipado.
**No llama a `useTranslations` internamente.** El page server component es el
único lugar donde se resuelven los strings via `getTranslations('Namespace')`.

Por qué:
- Los slices son independientes y testeables sin contexto i18n.
- Permite que 8 agentes paralelos trabajen sobre componentes disjuntos sin
  pisarse en `messages/*.json` (el orquestador define la estructura del
  namespace primero).
- El componente declara qué strings necesita en su tipo `Hints`; el page
  resuelve con `t('key')`.

Definí los Hints en `types.ts` agrupados por slice:

```ts
// src/features/talents/detail/types.ts:233-263
export type HeaderHints = {
  statusLabels: StatusLabels;          // Record<status, label>
  updateStatusButton: string;
  noPhone: string;
  noEmail: string;
  manageTags: string;
  // ... + strings del modal de update
};

export type HighlightsHints = {
  ordersLabel: string;
  ratingLabel: string;
  // ...
  reviewsCount: string;                // template: "({count} reviews)"
};
```

Resolución en el page:

```tsx
// src/app/[locale]/(admin)/admin/talents/[id]/page.tsx:159-178
function readHeader(t: T) {
  return {
    noPhone: t('header.noPhone'),
    updateStatusButton: t('header.updateStatusButton'),
    // ... un objeto por slice, helper local readHeader/readHighlights/...
  };
}

const hints = {
  header: { ...readHeader(t), statusLabels } as HeaderHints,
  highlights: readHighlights(t) as HighlightsHints,
  // ... uno por tab
};

return <TalentDetailTabs hints={hints} ... />;
```

Consumo en el componente:

```tsx
// src/features/talents/detail/components/header/talent-header.tsx:34
export function TalentHeader({ talent, hints, onStatusChanged, ... }: Props) {
  // hints.statusLabels[talent.status]   ← read directly, no t()
}
```

Templates con interpolación: el componente hace `.replace('{count}', ...)`
sobre el template recibido (ver `highlights-row.tsx:8-10` y
`notes-tab.tsx:34-44`).

### 2. Fetching server-side con `Promise.all`

El page hace UNA carga inicial paralela que devuelve todo lo necesario para
pintar las 6 tabs sin spinners adicionales. Cada tab recibe `initial<X>` como
prop; refetch posterior se hace via las mismas read actions desde el cliente.

```tsx
// src/app/[locale]/(admin)/admin/talents/[id]/page.tsx:54-72
const [
  availableTags,
  paymentsRes,
  documents,
  detailsRes,
  notes,
  reviews,
  ordersPage,
  talentOrdersForStats,
] = await Promise.all([
  getTalentTagOptions(locale),
  getTalentPayments(id),
  getTalentDocuments(id, locale),
  getTalentDetailsData(id, locale),
  getTalentNotes(id),
  getTalentReviews(id, locale),
  getTalentOrders({ talentId: id, page: 0, pageSize: 50 }, locale),
  fetchOrdersForStats(id),
]);
```

`getTalentDetail(id)` se carga ANTES del `Promise.all` porque define si
hacemos `notFound()`. Todo lo demás se asume que existirá si el talento
existe.

### 3. Tabs (shadcn base-nova)

Los tabs son shadcn vanilla, defaultValue = el tab más usado:

```tsx
// src/features/talents/detail/components/talent-detail-tabs.tsx:125-186
<Tabs defaultValue="orders">
  <TabsList>
    <TabsTrigger value="orders">{hints.tabs.orders}</TabsTrigger>
    {/* ... */}
  </TabsList>

  <TabsContent value="orders" className="pt-4">
    <OrdersTab
      talentId={talent.id}
      initialOrders={initialOrders}
      totalCount={initialOrdersTotal}
      hints={hints.orders}
      locale={locale}
    />
  </TabsContent>
  {/* ... un TabsContent por tab */}
</Tabs>
```

Cada `TabsContent` recibe `initial<Data>`, `hints` específicos del tab, y
callbacks de refetch del orquestador (ver punto 4).

### 4. Accordion sections (custom — NO existe Accordion en base-nova)

shadcn base-nova **no incluye `Accordion`**. Implementamos a mano un
`SectionShell` reusable que vive en `details-tab.tsx`. Cada sección tiene 3
modos:

1. **Collapsed**: header con título + chevron + preview text de 1 línea.
2. **Expanded read**: grid de `<Field label value fallback />` + botón
   "Editar".
3. **Expanded edit**: inputs + botones Guardar/Cancelar al pie.

Una sola sección abierta a la vez. Si tiene cambios sin guardar y el admin
intenta abrir otra, `window.confirm(hints.section.unsavedPrompt)`.

El shape del helper (ver `details-tab.tsx:99-151` para el cuerpo completo):

```tsx
type SectionShellProps = {
  title: string;
  open: boolean; onToggle: () => void;
  editing: boolean; onStartEdit: () => void; onCancelEdit: () => void; onSave: () => void;
  saving: boolean;
  canEdit?: boolean;
  hints: DetailsTabHints;
  previewText: string;
  readMode: ReactNode;
  editMode: ReactNode;
};
```

Tracking de `isDirty` y orquestación por sección: ver `details-tab.tsx:31-78`.
Cada section llama `onDirtyChange(boolean)` al parent; el parent guarda un
mapa `Record<SectionKey, boolean>` y consulta antes de cambiar `openSection`
(con `window.confirm`).

`Field` es un helper trivial para la grid de read-mode (ver
`details-tab.tsx:153-162`): renderiza `<dt>` con label gris + `<dd>` con value
o fallback.

Una sección típica detecta `dirty` con `JSON.stringify` shallow:

```tsx
// contact-section.tsx:43-50
const dirty = useMemo(
  () => editing && JSON.stringify(form) !== JSON.stringify(data),
  [editing, form, data],
);
useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
```

### 5. Sheet para "edit" de contenido complejo

Cuando la edición no entra en 6 inputs inline (multi-select, multi-step,
upload), usar `<Sheet side="right">` en vez de un edit-mode dentro del
accordion.

Casos en talents/detail:
- `talent-services-section.tsx`: editar lista de servicios + precios.
- `mark-as-paid-sheet.tsx`: 3 steps con upload.
- `payment-detail-sheet.tsx`: read-mode con tabla items + descarga.

El shape mínimo: `<Sheet open onOpenChange>` envuelve `<SheetContent
side="right" className="overflow-y-auto sm:max-w-lg">` con `<SheetHeader> +
contenido + <SheetFooter>` (Cancelar/Guardar). Ver
`talent-services-section.tsx:117-166`.

### 6. Modal de update = Sheet (porque base-nova NO tiene Dialog)

shadcn base-nova **tampoco incluye `Dialog`**. Para "modales" usar el mismo
`<Sheet side="right">` que para edits complejos. Patrón canónico en
`update-status-modal.tsx:73-127`.

Importante: en `handleOpenChange(false)` resetear el form state local
(reset al `currentStatus` original, vaciar `reason`). Ver
`update-status-modal.tsx:47-53`.

### 7. Anatomía del header

Avatar 56px (`size-14`) circular con `<AvatarFallback>` mostrando iniciales
si no hay `photo_url`. Layout flex de 3 zonas: **avatar | info (h1 + subline
+ tags) | botón primario "Actualizar X"**. Ver `talent-header.tsx:54-107`
para el JSX completo. `getInitials` (parsea primera+última palabra del
nombre) en `talent-header.tsx:24-32`.

Subline = `phone · email · country` con separadores ` · ` (middle dot).
`status === null` → mostrar `'—'`. Si onboarding pendiente, badge ámbar
adicional (ver `talent-header.tsx:74-78`).

### 8. Highlights row

Una fila horizontal con `|` como separadores entre items. 4 stats máx,
inline-only (no cards). Cuando un valor es null/0, mostrar `hints.none`
(ej: `★ — (0)` en lugar de `★ NaN`). Ver `highlights-row.tsx:34-47` para
el render con `.map()` + separador conditional.

### 9. Notes tab (timeline + composer)

Composer pinned arriba (Textarea + botón "Agregar nota"), timeline DESC
debajo. Notas con `pinned=true` flotan al tope; notas con `is_system=true`
se renderizan distinto (gris, ícono Cog).

Optimistic prepend: el resultado del action `createTalentNote` devuelve el
`TalentNote` ya enriquecido con `author_name`; el cliente lo prepende a la
lista local.

```tsx
// notes-tab.tsx:72-84
function handleSubmit() {
  if (!canSubmit) return;
  startTransition(async () => {
    const result = await createTalentNote({ talentId, body: trimmed });
    if ('error' in result) {
      toast.error(result.error.message || hints.errorSaving);
      return;
    }
    setNotes((prev) => sortNotes([result.data, ...prev]));
    setBody('');
  });
}

// sort: pinned first, then created_at DESC
function sortNotes(notes: TalentNote[]): TalentNote[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
```

Tiempo relativo via función pura `formatRelative` con templates de hints
(`hints.relativeMinutes` = `"hace {count} min"`). Si pasaron > 7 días,
fallback a `Intl.DateTimeFormat`. Ver `notes-tab.tsx:27-50`.

### 10. Contrato de server actions

Todas las write actions devuelven `{ data: T } | { error: { message: string } }`.
Permite type-narrowing con `'error' in res`.

```ts
// save-personal-data.ts
type Result = { data: { ok: true } } | { error: { message: string } };

export async function saveTalentPersonalData(input: unknown): Promise<Result> {
  const supabase = createClient();
  const parsed = savePersonalDataSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  // ... db ops, devolver { error: { message } } o { data: { ok: true } }
  revalidatePath('/[locale]/(admin)/admin/talents/[id]', 'page');
  return { data: { ok: true } };
}
```

Reglas:
- Validar siempre con Zod. El schema vive en `detail/schemas.ts`.
- `input: unknown` (no tipado) — Zod hace el narrow.
- `revalidatePath` con la ruta del page al final de cada write.
- Si la write devuelve algo útil al cliente (ej. row insertado),
  `data: TalentNote` en vez de `data: { ok: true }`. Ver `create-talent-note.ts`.

> NOTA: PATTERNS.md documenta el contrato genérico `{ data, error }` con error
> sin `.message`. Para detail pages preferimos el shape más rico
> `{ error: { message } }` para que el cliente pueda surfacearlo en toasts
> sin parsear el shape de Zod.

### 11. Error feedback en el cliente

```tsx
const res = await saveTalentContact(payload);
if ('error' in res) {
  toast.error(res.error.message || hints.section.saveError);
  return;
}
toast.success(hints.section.saveSuccess);
```

Por qué `||`: el backend devuelve mensajes específicos (ej. "duplicate key
value violates..."). Si el backend no manda nada, fallback al string genérico
del hint. Esto da diagnosticabilidad sin que el toast quede vacío.

### 12. Refetch tras saves (callback explícito vs `router.refresh()`)

El orquestador expone callbacks `onStatusChanged`, `onTagsChanged`,
`onSectionSaved` a los hijos. Cada uno re-llama la read action correspondiente
y actualiza el state local del orquestador (ver
`talent-detail-tabs.tsx:96-112`). Esto evita re-renderizar todo el page
cuando solo cambió un slice.

Para tabs que dependen de filtros server-side complejos (ej. `payments-tab`
con paginación), `router.refresh()` directo — fuerza re-fetch del Server
Component padre (ver `payments-tab.tsx:68-71`).

## Gotchas (errores que ya cometimos — no los repitas)

### base-ui Select necesita render-prop para mostrar label

A diferencia de Radix, `<SelectValue>` muestra el `value` raw (UUID feo). Hay
que pasar un render-prop que mapee value → label:

```tsx
// contact-section.tsx:117-123
<SelectTrigger>
  <SelectValue placeholder={hints.notProvided}>
    {(v) =>
      v === NONE_VALUE || !v
        ? hints.notProvided
        : labelMap.get(v as string) ?? hints.notProvided
    }
  </SelectValue>
</SelectTrigger>
```

Construir el `labelMap` con `new Map(options.map((o) => [o.value, o.label]))`.

Para selects "no value" usar un sentinel literal (`const NONE_VALUE = '__none__'`)
porque base-ui no acepta `value=""` de forma confiable.

Ejemplos: `contact-section.tsx`, `payment-prefs-section.tsx`,
`update-status-modal.tsx:82-100`.

### `DropdownMenuLabel` rompe sin `DropdownMenuGroup`

`<DropdownMenuLabel>` espera estar dentro de un `<DropdownMenuGroup>`; si no,
crashea con `MenuGroupRootContext is missing` y vuela todo el árbol React.
Solución preferida: reemplazar por un `<div>` plano con clases utilitarias:

```tsx
// talent-tags-display.tsx:87-89
<div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
  {hints.manageTags}
</div>
```

### Admin es público durante construction — auth opcional

Ver `project_construction_rls_stance.md`. El admin layout NO requiere login
hoy. Las actions NO deben hacer `if (!auth.user) return error` — eso rompe
el flow.

Para columnas FK nullables (`author_id`, `assigned_by`, `created_by`), pasar
`auth.user?.id ?? null`:

```ts
// create-talent-note.ts:21-31
const { data: auth } = await supabase.auth.getUser();
const authorId = auth.user?.id ?? null;

await supabase.from('talent_notes').insert({
  talent_id: talentId,
  author_id: authorId,        // nullable FK — OK con null
  body, is_system: false, pinned: false,
});
```

### Address shape para storage

`AddressAutocomplete` devuelve un `EMPTY_ADDRESS = { street: '', raw_text: '', ... }`
cuando el usuario no toca el input. NO mandar ese objeto vacío a la DB —
manda `null` para que la columna jsonb quede NULL.

```tsx
// contact-section.tsx:83-87
function normalizeAddress(addr: AddressValue | null): AddressValue | null {
  if (!addr) return null;
  const isEmpty = !addr.raw_text && !addr.street && !addr.postal_code && !addr.mapbox_id;
  return isEmpty ? null : addr;
}
```

### shadcn `Button` no tiene `asChild`

base-nova's `Button` usa `render` prop (estilo base-ui), no `asChild`
(estilo Radix). Para envolver un `<Link>` con estilo de botón hay dos vías:

- Usar `render={<Link href="..." />}` si soporta el prop.
- Renderizar un `<Link>` plano con `className={buttonVariants(...)}` o
  con las mismas clases utility a mano.

Ver `talent-header.tsx:92-96` para el botón normal y
`talent-tags-display.tsx:78-85` para el patrón `render={<Button ... />}` en
un `<DropdownMenuTrigger>`.

### CHECK constraints de la DB tienen que matchear los enums del componente

Especialmente `preferred_payment`, `professional_status`, `gender`. Si el
Select del componente ofrece un valor que no está en el `CHECK (status IN
(...))`, la save falla con `violates check constraint`. Documentar el set
canónico en `types.ts` (ej. `TALENT_PAYMENT_STATUSES`,
`TALENT_PAYMENT_METHODS` en `talents/detail/types.ts:8-12`) y referenciar
las migraciones que los alinean.

### `revalidatePath` con segmentos dinámicos

El path tiene que matchear el segment template, no la URL real:

```ts
// CORRECTO
revalidatePath('/[locale]/(admin)/admin/talents/[id]', 'page');

// INCORRECTO — no invalida nada
revalidatePath(`/${locale}/admin/talents/${id}`);
```

### Placeholders en hints: usar `[count]`, NO `{count}`

next-intl pasa los strings por ICU MessageFormat. Si un value en el JSON
contiene `{name}` y la llamada `t('key')` no recibe `{ name }`, ICU detecta
el placeholder no resuelto y next-intl devuelve la key cruda como fallback
(ej: `AdminClientDetail.highlights.pendingOrdersSuffix` se renderiza tal
cual en pantalla).

En este pattern los hints son strings que el componente substituye él mismo
con `String.replace`, así que el page.tsx NO le pasa el valor al `t()`.
Solución: usar `[count]` (o cualquier delimitador no-ICU) en el JSON:

```json
// CORRECTO (ICU lo trata como texto literal)
"pendingOrdersSuffix": "([count] órdenes)",
"reviewsCount": "([count] reviews)",
"relativeMinutes": "hace [count]m",

// INCORRECTO (ICU intenta substituir y falla en runtime)
"pendingOrdersSuffix": "({count} órdenes)"
```

Y en el componente:

```tsx
hints.pendingOrdersSuffix.replace('[count]', String(count));
```

Excepción: si el page.tsx SÍ tiene el count y va a llamar `t('key',
{ count })`, entonces el JSON sí puede usar `{count}` como ICU puro
(ej: `moreServices`, `rowsDetected` en este repo). Para hints servidos al
componente, usar `[count]`.

## Folder layout para una nueva detail feature

```
src/features/<entity>/
└── detail/
    ├── types.ts              ← todos los types + Hints contracts
    ├── schemas.ts            ← Zod por cada save action
    ├── index.ts              ← barrel: types + actions + componentes
    ├── lib/                  ← helpers puros (compose stats, extract docs)
    ├── actions/              ← read (get-*) + write (save-*, update-*) actions
    └── components/
        ├── header/
        │   ├── <entity>-header.tsx
        │   ├── status-badge.tsx
        │   ├── update-status-modal.tsx
        │   └── <entity>-tags-display.tsx
        ├── highlights/
        │   └── highlights-row.tsx
        ├── tabs/
        │   ├── <main-list>-tab.tsx          (default tab)
        │   ├── <feature>/                   (carpeta cuando el tab tiene sub-componentes)
        │   │   ├── <feature>-tab.tsx
        │   │   └── <feature>-sheet.tsx
        │   ├── details/                     (si hay sección con accordion)
        │   │   ├── details-tab.tsx          ← exporta SectionShell + Field
        │   │   └── <name>-section.tsx       (uno por sección)
        │   └── notes-tab.tsx
        └── <entity>-detail-tabs.tsx         (orchestrator client)
```

Ver el template real en `src/features/talents/detail/`. ~3000 LOC totales
distribuidos: foundation 700 + slices 1500-1800 + assembly 250.

Y la ruta:

```
src/app/[locale]/(admin)/admin/<entity>/[id]/page.tsx
```

## Workflow de agentes paralelos

Esta arquitectura está diseñada para 8 agentes en paralelo. Receta:

1. **Orquestador secuencial — S1: DB foundation.** Migrations + regenerar
   `database.types.ts` + verificar typecheck. ~80 SQL.
2. **Orquestador secuencial — S2: feature foundation.** El orquestador
   escribe TODO esto antes de spawnear agentes:
   - `detail/types.ts` con todos los Hints exportados (HeaderHints,
     HighlightsHints, OrdersTabHints, ...). Cada agente consume el contrato,
     no improvisa nombres.
   - `detail/schemas.ts` con Zod por cada save action.
   - `detail/lib/*` puro.
   - **TODOS los actions** (read + write). Los componentes los importan; si
     no existen, los agentes blockean.
   - i18n: namespace completo en los 5 locales con TODOS los strings que
     cualquier slice necesita.
   - `detail/index.ts` con exports parciales.
3. **8 agentes en paralelo.** Cada uno trabaja en un subdirectorio único
   dentro de `detail/components/` (header/, highlights/, tabs/orders-tab.tsx,
   tabs/payments/, tabs/documents-tab.tsx, tabs/details/, tabs/notes-tab.tsx,
   tabs/reviews-tab.tsx). Sin imports cross-slice.
4. **Orquestador secuencial — S3: assembly.** Crea el `<EntityDetailTabs>`
   orchestrator + `page.tsx` + linkea desde la tabla del listado. Verifica
   typecheck + tests + build.

Por qué la foundation va primero: cada slice necesita los `Hints` types y
los actions YA definidos. Si los agentes inventan nombres, no compilan
juntos en el assembly. Ver `docs/features/admin-talent-detail.md` lines
442-671 para el split exacto que usamos en talents.

## Presupuesto i18n

Una detail feature típica = ~150-200 keys × 5 locales = ~750-1000 strings.
Volumen alto pero manejable.

Estructura del namespace en `messages/es.json`:

```json
{
  "AdminTalentDetail": {
    "backToList": "...",
    "header": { "noPhone": "...", "updateStatusButton": "...", ... },
    "highlights": { "ordersLabel": "...", "ratingLabel": "...", ... },
    "tabs": { "orders": "...", "payments": "...", ... },
    "orders": { "columnNumber": "...", "filterStatus": "...", ... },
    "payments": { "preferredPaymentLabel": "...", "methodLabels": { ... }, "statusLabels": { ... }, ... },
    "documents": { ... },
    "details": { "section": { ... }, "personalDataTitle": "...", "fullNameLabel": "...", ... },
    "notes": { "composerPlaceholder": "...", "relativeMinutes": "hace {count} min", ... },
    "reviews": { ... }
  }
}
```

Agrupar por slice (header/highlights/tabs/<tab>/...) para que el `read<Slice>`
helper en page.tsx sea trivial (un objeto literal con `t('slice.key')`).

## Referencias

- Implementación canónica: `src/features/talents/detail/`
- Spec de la phase: `docs/features/admin-talent-detail.md`
- PATTERNS.md (server actions, server components, structure básica): `docs/PATTERNS.md`
- I18N: `docs/I18N.md`
- Stance sobre auth/RLS: memoria `project_construction_rls_stance.md`
