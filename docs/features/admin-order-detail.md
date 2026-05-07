# Detalle de orden (admin)

Página `/admin/orders/[id]` que muestra una orden en profundidad y permite
editar todos sus aspectos. Sigue `docs/ADMIN_DETAIL_PATTERN.md` adaptado al
volumen de información (header denso + 6 tabs).

## Goal — Phase 1 (UI con mocks, este plan)

1. UI completa renderizada en `/admin/orders/[id]` con header de info densa,
   datos del cliente y 6 tabs (Servicio, Especialistas, Horas, Pagos,
   Documentos, Actividad).
2. Datos básicos de la orden (número, status, fecha, total, cliente) **se
   leen de la DB real** (la orden existe, las migrations mínimas están).
3. Datos que requieren tablas nuevas (tags de orden, multi-talent assignment,
   recurrencia compleja, hours tracking, billing breakdown, activity timeline)
   son **mocks** en Phase 1.
4. Saves del editor del acordeón: **mocks que validan via Zod y devuelven OK
   sin tocar DB.**
5. Backend real planificado en Phase 2 (al final del doc).

## Out of scope (Phase 1)

- Crear tablas `order_tags`, `order_tag_assignments`, `order_talents`
  (junction multi-talent), `order_hours_logs`, `order_notes`,
  `order_recurrence`.
- Conectar billing real (Phase 2 reusará `client_payments` y `talent_payments`
  con items que apuntan a `order_id`).
- Crear admin UI `/admin/order-tags` (catálogo de tags de orden — feature
  separado análogo a `/admin/talent-tags`).
- Conectar Stripe / sistemas de pago externos (`orders.stripe_id` ya existe
  pero no lo tocamos).
- RLS — admin sigue público durante construction.

## Layout (Alternativa C, header denso + 6 tabs)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Volver al listado                                                  │
│                                                                      │
│ #1042 · Apoyo familiar a menores              [Editar] [Cancelar]    │
│                                                                      │
│ Status: [Pendiente ▼]  Pago: Pagado   Responsable: Laura Pérez       │
│ Duración: 1h    Fecha: Sep 30 - Oct 30, 2026   Horario: 10:00-11:00  │
│ Total: 12,00 € (IVA incluido)         Creada: 18 Septiembre 2026     │
│ Tags: [Urgente] [Cliente VIP]  [+ gestionar]                         │
│                                                                      │
│ Cliente: María García López · maria@example.com · +34 600 111 222    │
│                                                                      │
│ [Servicio] [Especialistas] [Horas] [Pagos] [Documentos] [Actividad]  │
│ ────────────────────────                                             │
│ <tab content>                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

El header es más denso que talents/clients porque la orden tiene MUCHA
información clave en la parte superior. Conserva la estructura general
(header + tabs) pero agrupa los campos en filas de meta-info en vez de
"highlights row".

## Decisiones de diseño tomadas

1. **9 estados de orden** (en lugar de 6 actuales). Mapping de migration:
   - `nuevo` → `pendiente`
   - `buscando_talento` → `pendiente`
   - `asignado` → `asignado`
   - `en_curso` → `confirmado`
   - `completado` → `terminado`
   - `cancelado` → `cancelado`
   - Nuevos: `confirmado`, `completado`, `pendiente_de_pago`, `rechazado`, `archivado`.
2. **Multi-talent**: Phase 2 introducirá tabla `order_talents` (junction).
   Phase 1 muestra mock con 1-3 talents asignados. La columna actual
   `orders.talent_id` queda como "primary talent" backwards-compatible y se
   migra al primer entry de la junction.
3. **Recurrencia completa**: extender `orders.schedule_type` a
   `('once','daily','weekly','biweekly','monthly','quarterly','semiannual','annual')`.
   Para los detalles (días marcados, fecha inicio/fin, preferencia horaria,
   "repetir cada X"), Phase 2 agregará columnas/tabla `order_recurrence`.
   Phase 1 mock.
4. **Talent rating per service** (la columna "Reputación en el servicio" en
   tab Especialistas): se calcula como avg de `orders.rating` filtrando por
   `talent_id` + `service_id`. Phase 2 lo computa real; Phase 1 mock.
5. **Billing**: reusamos `client_payments` y `talent_payments` (creadas en el
   feature anterior). Cada billing line es un `client_payment_item` o
   `talent_payment_item` con `order_id` apuntando a esta orden. El botón
   "Facturar" crea un `client_payment` (status `pending`) que agrupa los
   items + un `talent_payment` (status `pending`). Phase 2; Phase 1 mock con
   modal.
6. **Tags de orden**: Phase 2 crea tabla `order_tags` análoga a
   `talent_tags` + admin UI separada `/admin/order-tags`. Phase 1 mock.
7. **Hours tracking**: Phase 2 crea tabla `order_hours_logs` (entries por
   talent: tipo, cantidad, precio, confirmado_por). Phase 1 mock con la UI
   de las imágenes (Total horas / Total km / Otros).
8. **Activity timeline**: Phase 2 crea `order_notes` análoga a `talent_notes`
   (composer + timeline + system entries). Phase 1 mock con datos hardcodeados.
9. **Sin botón "Update status" tipo modal** como en talents — el status se
   edita inline en el header con un Select. Cambios al status crean entry
   automática en activity timeline (Phase 2).
10. **Sin highlights row** — la info de "highlights" está integrada en el
    header como filas de meta-info.

## Información a mostrar (mapeo a schema)

### Header

| Item UI | Fuente |
|---|---|
| #order_number | `orders.order_number` |
| service_name (h1) | `services.i18n[locale].name` |
| status (Select inline) | `orders.status` |
| payment_status (badge) | `orders.payment_status` |
| Responsable | `orders.staff_member_id` → `staff_profiles` JOIN |
| Duración estimada | derived (mock Phase 1; Phase 2: `services.estimated_duration_min`) |
| Fecha del servicio | `orders.appointment_date` (+ end calculated by recurrence) |
| Horario | derived from `appointment_date` |
| Total | `orders.price_total` + `orders.currency` |
| Fecha creación | `orders.created_at` |
| Tags | mock Phase 1 / `order_tag_assignments` Phase 2 |
| Cliente nombre | `profiles.full_name` (via client_id → profiles.id) |
| Cliente email | `profiles.email` |
| Cliente teléfono | `profiles.phone` |

### Tab Servicio

4 secciones acordeón (mismo patrón `SectionShell`):

1. **Lenguaje**: `preferred_language` (mock Phase 1; Phase 2 nueva columna
   `orders.preferred_language` FK `spoken_languages.code`).
2. **Dirección del servicio**: `orders.service_address`,
   `orders.service_city_id` (→ cities), `orders.service_postal_code`,
   country derivado de city.
3. **Servicio**: nombre del servicio (read-only), respuestas del cliente a
   las `services.questions` (jsonb) leyendo de `orders.form_data`. Cada
   pregunta editable según su tipo.
4. **Tipo de oferta**: `orders.schedule_type` + recurrencia (mock Phase 1;
   Phase 2: extender enum + tabla `order_recurrence` con
   `repeat_every`, `weekdays`, `start_date`, `end_date`,
   `time_window_start`, `time_window_end`).
5. **Notas**: `orders.notes` + `orders.talents_needed` (int — nuevo).

### Tab Especialistas

Lista de talents asignados. Modal "+ Añadir talent" busca en `talent_profiles`
filtrados por servicio + país de la orden.

| Columna | Fuente |
|---|---|
| Nombre | `profiles.full_name` |
| Email | `profiles.email` |
| Teléfono | `profiles.phone` |
| Reputación en el servicio | mock Phase 1; Phase 2: `AVG(orders.rating WHERE talent_id=X AND service_id=Y)` |
| Servicios realizados | mock Phase 1; Phase 2: `COUNT(orders WHERE talent_id=X AND service_id=Y AND status='terminado')` |
| Botón Seleccionar/Quitar | mock Phase 1; Phase 2: insert/delete en `order_talents` |

Validación: máximo `orders.talents_needed` talents seleccionados; si excede,
toast.

### Tab Horas

Tabla con 3 filas fijas + filas dinámicas (Otros):

| Categoría | Precio Uni | Reportado por (mock Phase 1) | Confirmado |
|---|---|---|---|
| Total horas (cliente: 0) | input numérico (€) | nombre del talent + reportadas | input |
| Total kilómetros | input | nombre + km reportados | input |
| Otros | input descripción + precio | nombre | input |

Phase 2 modela como `order_hours_logs` (talent_id, kind, reported_qty,
unit_price, confirmed_qty).

### Tab Pagos

2 sub-secciones:

#### Se facturará al cliente
- Tabla con líneas: Servicio / Precio Uni / QTD / Descuento / Precio.
- Línea autogenerada "Total de Horas" basada en horas + precio.
- Botón "Agregar línea" abre modal "Nueva línea" (Descripción / Precio Uni /
  QTD / Desconto).
- Subtotal + VAT (21%) + Total.
- Botón "Facturar" → crea `client_payment` con status `pending`. Cierra el
  agregado de líneas (read-only after).

#### A emitir para Talento {nombre}
- Tabla similar pero sin VAT (los talents no facturan IVA al cliente).
- Líneas autogeneradas: "Total de Horas" según `talent_amount` o `unit_price`
  del talent.
- Subtotal + Total (sin VAT).
- Una sub-tabla por talent asignado.

Phase 1 mock con datos visualizables; Phase 2 wires reales.

### Tab Documentos

Reusa el patrón de talent: extrae files de `services.questions` (no
`talent_questions`) con `type=file` → busca la URL en `orders.form_data`
(las respuestas del cliente).

### Tab Actividad

Timeline DESC + composer (textarea + botón "Agregar nota"). Phase 2 con
tabla `order_notes`. Sistema notes registra automáticamente status changes,
asignaciones de talent, marca de "Facturado", etc. (Phase 2).

## Modelo de datos

### Schema actual relevante (no se toca en Phase 1 más allá de S1)

`orders` tiene la mayoría de columnas necesarias para el Phase 1. S1 agrega:
- `talents_needed int NOT NULL DEFAULT 1` (cuántos talents máximo).
- `preferred_language text NULL` (FK soft a `spoken_languages.code`).
- Migration de `status` enum a 9 valores.
- Migration de `schedule_type` enum a 8 valores.

`staff_profiles`, `profiles`, `services`, `talent_profiles`, `cities`,
`countries`, `spoken_languages`, `client_payments`, `talent_payments` ya
existen.

### Schema nuevo en Phase 2 (NO migrar en Phase 1)

```sql
-- Tags de orden (catálogo)
CREATE TABLE order_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  i18n jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_tag_assignments (
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES order_tags(id) ON DELETE CASCADE,
  assigned_by uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (order_id, tag_id)
);
CREATE INDEX idx_order_tag_assignments_tag ON order_tag_assignments(tag_id);

-- Multi-talent por orden (extiende orders.talent_id legacy)
CREATE TABLE order_talents (
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  talent_id uuid NOT NULL REFERENCES talent_profiles(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  assigned_by uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (order_id, talent_id)
);
CREATE INDEX idx_order_talents_talent ON order_talents(talent_id);

-- Recurrence detail
CREATE TABLE order_recurrence (
  order_id uuid PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  repeat_every int NOT NULL DEFAULT 1 CHECK (repeat_every >= 1),
  weekdays int[] NULL, -- subset of 0-6 (0=Sunday)
  start_date date NOT NULL,
  end_date date NULL,
  time_window_start time NULL,
  time_window_end time NULL,
  hours_per_session numeric(5,2) NULL CHECK (hours_per_session IS NULL OR hours_per_session > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Hours tracking
CREATE TABLE order_hours_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  talent_id uuid NULL REFERENCES talent_profiles(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('hours','kilometers','other')),
  description text NULL,
  unit_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  reported_qty numeric(10,2) NOT NULL DEFAULT 0 CHECK (reported_qty >= 0),
  confirmed_qty numeric(10,2) NULL CHECK (confirmed_qty IS NULL OR confirmed_qty >= 0),
  reported_by uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  confirmed_by uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  confirmed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_hours_logs_order ON order_hours_logs(order_id);

-- Activity timeline
CREATE TABLE order_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  author_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  body text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_notes_order ON order_notes(order_id, created_at DESC);
```

Total Phase 2: 6 tablas nuevas + columnas nuevas en `orders`.

## Estructura de archivos

```
src/features/orders/
├── (existente: actions/list-orders.ts, get-filter-options.ts, etc.)
├── (existente: components/orders-list.tsx, orders-table.tsx, orders-toolbar.tsx)
└── detail/                                          NUEVA SECCIÓN
    ├── types.ts                                     [foundation]
    ├── schemas.ts                                   [foundation]
    ├── index.ts                                     [foundation, ensamble final actualiza]
    ├── lib/
    │   └── compose-order-detail.ts                  [foundation]
    ├── actions/
    │   ├── get-order-detail.ts                      [foundation, REAL DB read]
    │   ├── get-order-service-data.ts                [foundation, MOCK]
    │   ├── get-order-talents.ts                     [foundation, MOCK]
    │   ├── get-talent-search-results.ts             [foundation, MOCK con DB lookup talent_profiles]
    │   ├── get-order-hours.ts                       [foundation, MOCK]
    │   ├── get-order-billing.ts                     [foundation, MOCK]
    │   ├── get-order-documents.ts                   [foundation, REAL — extract from form_data]
    │   ├── get-order-activity.ts                    [foundation, MOCK]
    │   ├── get-order-tag-options.ts                 [foundation, MOCK]
    │   ├── update-order-status.ts                   [foundation, MOCK + Zod]
    │   ├── update-order-tags.ts                     [foundation, MOCK]
    │   ├── save-order-language.ts                   [foundation, MOCK]
    │   ├── save-order-address.ts                    [foundation, MOCK]
    │   ├── save-order-service-answers.ts            [foundation, MOCK]
    │   ├── save-order-recurrence.ts                 [foundation, MOCK]
    │   ├── save-order-notes.ts                      [foundation, MOCK]
    │   ├── add-order-talent.ts                      [foundation, MOCK]
    │   ├── remove-order-talent.ts                   [foundation, MOCK]
    │   ├── save-order-hours.ts                      [foundation, MOCK]
    │   ├── add-billing-line.ts                      [foundation, MOCK]
    │   ├── invoice-order.ts                         [foundation, MOCK]
    │   ├── add-order-activity-note.ts               [foundation, MOCK]
    │   └── cancel-order.ts                          [foundation, MOCK]
    └── components/
        ├── header/                                  [Slice A — agente 1]
        │   ├── order-header.tsx
        │   ├── order-status-select.tsx
        │   ├── order-tags-display.tsx
        │   └── client-summary.tsx
        ├── tabs/
        │   ├── service/                             [Slice B — agente 2]
        │   │   ├── service-tab.tsx
        │   │   ├── language-section.tsx
        │   │   ├── address-section.tsx
        │   │   ├── service-answers-section.tsx
        │   │   ├── recurrence-section.tsx
        │   │   └── notes-section.tsx
        │   ├── specialists/                         [Slice C — agente 3]
        │   │   ├── specialists-tab.tsx
        │   │   └── search-talent-modal.tsx
        │   ├── hours/                               [Slice D — agente 4]
        │   │   ├── hours-tab.tsx
        │   │   └── hours-row.tsx
        │   ├── billing/                             [Slice E — agente 5]
        │   │   ├── billing-tab.tsx
        │   │   ├── client-billing-section.tsx
        │   │   ├── talent-billing-section.tsx
        │   │   └── new-billing-line-modal.tsx
        │   ├── documents-tab.tsx                    [Slice F — agente 6]
        │   └── activity-tab.tsx                     [Slice G — agente 7]
        └── order-detail-tabs.tsx                    [final assembly — orquestador]
```

Ruta admin:
```
src/app/[locale]/(admin)/admin/orders/[id]/
└── page.tsx                                         [final assembly — orquestador]
```

## Slices paralelos (7 agentes)

### Slice A — Header (1 agente)
**Files:** `header/order-header.tsx`, `header/order-status-select.tsx`,
`header/order-tags-display.tsx`, `header/client-summary.tsx`.
**Goal:** info densa (#order_number + service_name h1; status Select inline;
payment_status badge; responsable + duración + fechas + horario + total +
creación; tags chip row con popover de gestión; cliente summary debajo).
Botones top-right: "Cancelar orden" (variant `destructive`) abre modal de
confirmación.

### Slice B — Tab Servicio (1 agente, slice grande)
**Files:** todo dentro de `tabs/service/`.
**Goal:** 5 secciones acordeón reusando `SectionShell` (definido localmente
dentro de `service-tab.tsx`, mismo patrón que talents/clients):
1. Lenguaje (Select de spoken_languages).
2. Dirección del servicio (input + country/city Selects).
3. Servicio (read-only nombre + render dinámico de respuestas via
   `@/shared/components/question-renderers`).
4. Tipo de oferta (recurrencia: schedule_type Select + repeat_every input +
   weekdays toggles + start/end dates + time window + hours_per_session +
   resumen autogenerado).
5. Notas (textarea + talents_needed input numérico).

### Slice C — Tab Especialistas (1 agente)
**Files:** `tabs/specialists/specialists-tab.tsx`,
`tabs/specialists/search-talent-modal.tsx`.
**Goal:** lista de talents asignados con columnas (nombre, email, teléfono,
rating en servicio, count de servicios, botón Seleccionar/Quitar). Modal
buscar talent (Input search + tabla resultados + paginación + botón
Seleccionar). Validación max `talents_needed`.

### Slice D — Tab Horas (1 agente)
**Files:** `tabs/hours/hours-tab.tsx`, `tabs/hours/hours-row.tsx`.
**Goal:** tabla con filas fijas (Total horas / Total km) + filas dinámicas
(Otros, agregar). Cada fila: descripción / precio_uni / reportado_por +
reportada_qty / confirmada_qty input. Save action `saveOrderHours`.

### Slice E — Tab Pagos (1 agente, slice grande)
**Files:** `tabs/billing/billing-tab.tsx`, `client-billing-section.tsx`,
`talent-billing-section.tsx`, `new-billing-line-modal.tsx`.
**Goal:** 2 secciones (cliente con VAT 21% + talents sin VAT). Cada una con
tabla de líneas, botón "Agregar línea" → modal, Subtotal/VAT/Total, botón
"Facturar". Read-only after invoice issued.

### Slice F — Tab Documentos (1 agente)
**File:** `tabs/documents-tab.tsx`.
**Goal:** lectura real de `services.questions` filtrando por type=file +
URL en `orders.form_data`. Patrón análogo a talent documents-tab pero
escaneando `services.questions` (preguntas del cliente) en lugar de
`talent_questions`.

### Slice G — Tab Actividad (1 agente)
**File:** `tabs/activity-tab.tsx`.
**Goal:** timeline + composer reusando patrón de `notes-tab` de talent.
Diferencia: aquí los system notes son automáticos (cambio de status, etc.),
y se mockean en Phase 1.

## Final assembly (S3, orquestador)

- `components/order-detail-tabs.tsx`: monta header + 6 tabs.
- `index.ts`: re-exports finales.
- `src/app/[locale]/(admin)/admin/orders/[id]/page.tsx`:
  - `unstable_setRequestLocale(locale)`.
  - `getOrderDetail(id, locale)` → si null, `notFound()`.
  - `Promise.all` para todos los datos iniciales (mocks + reales).
  - Resuelve hints `AdminOrderDetail` con helper functions (mismo patrón que
    talent/client page.tsx).
- Modificar `orders-table.tsx`: el `order_number` cell ahora link a
  `/admin/orders/[id]`.

## i18n — namespace `AdminOrderDetail`

Aprox 150 keys × 5 locales = 750 strings:
- backToList, notFoundTitle, notFoundDescription
- header: status labels (9), payment status labels, fields, deleteButton/Modal
- tabs: service, specialists, hours, billing, documents, activity
- service tab: 5 section titles, field labels, placeholders, recurrence labels
  (daily/weekly/biweekly/monthly/quarterly/semiannual/annual), weekday short
  names (L M M J V S D)
- specialists: column labels, modal labels, action buttons, validation messages
- hours: column labels, row defaults, save messages
- billing: section titles, column labels, modal labels, "Facturar" button,
  status labels
- documents: column labels, empty state, download
- activity: composer, timeline, system labels

Para todos los hints con `[count]` placeholder, usar `[count]` no `{count}`
(per `docs/ADMIN_DETAIL_PATTERN.md` gotcha #8).

## Phase 2 — Backend real (COMPLETADO 2026-05-05)

Sesiones secuenciales (sin agentes paralelos — cambios concentrados en
actions y migrations):

### P2.S1 — Migrations completas
- 6 tablas nuevas listadas arriba.
- Backfill `order_talents` desde `orders.talent_id` (1 row por orden con
  `is_primary=true`).
- Indexes.
- (NO crear admin UI `/admin/order-tags` aquí — feature separado.)

### P2.S2 — Reads reales
Reemplazar mocks de:
- `get-order-service-data.ts` (recurrencia + answers from form_data).
- `get-order-talents.ts` (JOIN order_talents + profiles + talent_profiles).
- `get-talent-search-results.ts` (query talent_profiles WHERE has talent_service
  for service_id of this order).
- `get-order-hours.ts` (query order_hours_logs).
- `get-order-billing.ts` (compute current state from client_payment_items +
  talent_payment_items WHERE order_id).
- `get-order-activity.ts` (query order_notes).
- `get-order-tag-options.ts` (query order_tags).

### P2.S3 — Writes reales
Reemplazar mocks de:
- `update-order-status.ts` (update orders.status + insert order_notes system).
- `update-order-tags.ts` (reconcile order_tag_assignments).
- `save-order-language.ts`, `save-order-address.ts`,
  `save-order-service-answers.ts` (update orders columns + form_data jsonb).
- `save-order-recurrence.ts` (upsert order_recurrence).
- `save-order-notes.ts` (update orders.notes + talents_needed).
- `add-order-talent.ts`, `remove-order-talent.ts` (insert/delete
  order_talents; validate talents_needed bound).
- `save-order-hours.ts` (upsert order_hours_logs).
- `add-billing-line.ts` (insert client_payment_items / talent_payment_items
  WHERE payment_id is the "draft" payment for this order).
- `invoice-order.ts` (transition draft client_payment + talent_payments to
  status=`pending`; mark order.payment_status='pendiente_de_pago').
- `add-order-activity-note.ts` (insert order_notes).
- `cancel-order.ts` (update orders.status='cancelado' + order_notes system).

### P2.S4 — Filtro list-orders por status nuevo
- Update orders-toolbar.tsx + i18n para los 9 status.

### P2.S5 — Seed
- Orden #1042 (María García López) enriquecida: 1 talent (Maxi) con primary,
  2 tags (Urgente + Cliente VIP), recurrencia bisemanal weekdays L-J-S
  15:00-19:00 (abril 2026), 2 hours_logs (6h confirmadas + 12 km pendientes),
  2 billing_lines drafts (cliente €72 + talent €50.40), 3 activity notes
  (1 system + 2 admin).

**Decisiones tomadas que difieren del spec original:**
1. **Tabla `order_billing_lines`** introducida en lugar de reusar
   client_payment_items / talent_payment_items para drafts. Razón: los items
   solo guardan `total`, perderíamos description/unit_price/qty/discount.
   Las lines persisten siempre y se vinculan al payment cuando se invoice
   via `client_payment_id` / `talent_payment_id` FK.
2. **`invoiceOrder` no es transaccional** (Supabase JS no expone txn fuera
   de RPCs). Si fallan los items inserts después del payment, queda payment
   huérfano. Documentado en el código; si se vuelve issue, mover a RPC
   SECURITY DEFINER.
3. **`staff_member_id` no se seedeó** porque su FK apunta a `staff_profiles`
   y la dev DB solo tiene 1 perfil de talent. El header muestra "Sin asignar".
4. **`order_tags` seed inicial** con 4 tags estándar (urgente / cliente_vip /
   repetido / dificil_acceso) en migración para que la UI tenga opciones
   reales sin UI de gestión todavía. Phase 3 puede agregar
   `/admin/order-tags`.

**Verificación:**
- `pnpm exec tsc --noEmit` clean.
- `pnpm test` clean (360 tests).
- `NODE_ENV=production pnpm build` clean.
- Ruta `/[locale]/admin/orders/[id]` 16.3 kB dynamic.

## Riesgos / cosas a vigilar

- **Tamaño total del feature**: 7 slices grandes + foundation. Estimado
  ~3500 LOC. **Excede el límite de 1500 LOC por feature.** Justificación
  para documentar excepción (igual que talent-onboarding):
  - 6 tabs distintos cada uno con su propia estructura interna.
  - Múltiples modales (search talent, new billing line, cancel modal).
  - Recurrencia tiene UI compleja sola.
  - Es la página más grande del admin.
  Documentar la excepción en `architecture.md` igual que con talent-onboarding.
- **`orders.status` migration con datos existentes**: 6 orders del cliente
  prueba están en `completado` y `asignado`. El mapping en S1 los pasa a
  `terminado` y `asignado`. Verificar count antes/después.
- **Cancel order vs cancelado**: el botón "Cancelar orden" en el header tiene
  significado distinto a "estado cancelado". Cancelar = transición a status
  `cancelado` + insert system note. No es soft-delete.
- **Recurrencia UI compleja**: el resumen autogenerado ("3 veces a la semana
  cada dos semanas, los días Lunes, Jueves y Sábado desde X hasta Y") es un
  helper que toma los campos y devuelve string i18n-aware. En Phase 1 lo
  rendea con valores mock; en Phase 2 con datos reales.
- **Modal "search talent"**: si la lista es grande necesita paginación
  server-side. Phase 1 mock con 5 talents fijos.
- **Billing read-only after invoice**: el flag `invoiced` se infiere de
  existencia de `client_payment` con status no-`draft`. En Phase 1 el state
  es local (`useState`).

## Verificación end-to-end (Phase 1)

1. `pnpm exec tsc --noEmit` clean.
2. `pnpm test` clean.
3. `NODE_ENV=production pnpm build` clean.
4. Sanity LOC: ningún `.tsx` > 250, archivos críticos como
   `service-tab.tsx` y `billing-tab.tsx` < 200.
5. `pnpm dev` smoke:
   - `/es/admin/orders/{id}` carga (uso una de las 6 órdenes del cliente
     prueba ya seeded).
   - Header muestra info densa correcta.
   - Status Select cambia (mock — toast OK).
   - Tab Servicio: las 5 secciones expanden y editan (mocks).
   - Tab Especialistas: lista mock + modal "Buscar talent" funciona, validación
     de max.
   - Tab Horas: tabla con inputs.
   - Tab Pagos: cliente con VAT, talent sin VAT, modal "Nueva línea", botón
     "Facturar" cierra el agregado.
   - Tab Documentos: muestra files extraídos de form_data o empty state.
   - Tab Actividad: timeline mock + composer (toast OK).
6. Multi-locale: `/en/admin/orders/{id}` carga con strings traducidos.

## Referencias

- `docs/ADMIN_DETAIL_PATTERN.md` — patrón general.
- `docs/features/admin-talent-detail.md` — referencia más cercana (6 tabs,
  notes timeline, multi-section accordion).
- `docs/features/admin-client-detail.md` — referencia para pagos +
  soft-delete.
