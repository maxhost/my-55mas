# Detalle de cliente (admin)

Página `/admin/clients/[id]` que muestra un cliente en profundidad y permite
editar sus datos / borrarlo. Sigue el patrón documentado en
`docs/ADMIN_DETAIL_PATTERN.md` (header + highlights + tabs + accordion).

## Goal — Phase 1 (UI con placeholders, este plan)

1. UI completa renderizada en `/admin/clients/[id]` con la jerarquía de
   componentes, tabs, accordion y formularios.
2. Datos del cliente (nombre, email, teléfono, país/ciudad/etc.) se leen de
   la DB real.
3. Stats (total pedidos, total pagado, balance adeudado), pedidos, pagos:
   **devueltos por server actions mock con datos hardcodeados.**
4. Saves (editar secciones del accordion, eliminar cliente): **server actions
   mock que no tocan DB pero devuelven `{ data: { ok: true } }`.**
5. Cliente de prueba creado en DB para que `[id]` resuelva.
6. Backend real planificado en una sesión separada (Phase 2 — al final del
   doc).

## Out of scope (Phase 1)

- Crear `client_payments` table en DB.
- Crear `client_profiles.deleted_at` column.
- Conectar pagos / pedidos a queries reales.
- Soft-delete real del cliente.
- Tags, status updates, notes (no fueron pedidos para clientes; `client_profiles.status`
  queda como hoy en read-only).
- RLS — admin sigue siendo público durante construction.

## Layout (Alternativa C, mismo patrón que talents)

```
┌─────────────────────────────────────────────────────────────┐
│ ← Volver al listado                                         │
│                                                             │
│ [Avatar] Nombre completo           empresa | particular     │
│          phone · email · país                  [Eliminar]   │
│                                                             │
│ Pedidos N | Total pagado X EUR | Adeudado X EUR             │
│                                                             │
│ [Pedidos] [Pagos] [Detalle]                                 │
│ ─────────────────────────────                               │
│ <tab content>                                               │
└─────────────────────────────────────────────────────────────┘
```

3 tabs (vs 6 en talents). Sin tags ni "Update status" prominentes — el
cliente tiene menos contenido editable.

## Información a mostrar (mapeo a schema)

| Item UI | Fuente |
|---|---|
| Nombre completo | `profiles.full_name` |
| Email | `profiles.email` |
| Teléfono | `profiles.phone` |
| Avatar | `profiles.avatar_url` (fallback iniciales) |
| Tipo (empresa/particular) | `client_profiles.is_business` |
| País | `profiles.preferred_country` (FK → countries) |
| Ciudad | `profiles.preferred_city` (FK → cities) |
| Dirección personal | `profiles.address` (jsonb: street, postal_code, lat/lng, raw_text) |
| Dirección de facturación | `client_profiles.billing_address` |
| Estado de facturación | `client_profiles.billing_state` |
| Código postal de facturación | `client_profiles.billing_postal_code` |
| Tipo de identificador fiscal | `client_profiles.fiscal_id_type_id` ⚠️ NUEVO (Phase 2 migration) |
| ID fiscal | `client_profiles.company_tax_id` |
| Nombre de empresa | `client_profiles.company_name` (solo si is_business=true) |
| Total pedidos | `count(orders WHERE client_id = profiles.id)` |
| Total pagado | `sum(orders.price_total WHERE client_id=... AND payment_status='paid')` |
| Balance adeudado | `sum(orders.price_total WHERE client_id=... AND payment_status IN ('pending','overdue'))` |
| Lista de pedidos | `orders WHERE client_id = profiles.id` ordenadas por fecha DESC |
| Lista de pagos | `client_payments` ⚠️ TABLA NUEVA (Phase 2 migration) |

## Decisiones de diseño tomadas

1. **Header sin botón "Update status".** El cliente tiene 2 status
   (`active` / `suspended`) y por ahora no se cambia desde admin. Sí muestra
   un badge read-only del status actual. Si después se quiere editar, se
   agrega como en talents.
2. **Botón "Eliminar cliente"** prominente en el header (variant destructive).
   Abre modal de confirmación. Soft-delete (Phase 2): setea
   `client_profiles.deleted_at = now()` y banea `auth.users.banned_until`.
   Mantiene `profiles` y todas las FK (orders, payments) intactas para
   accountability. Phase 1: action mock que devuelve OK + redirect a
   `/admin/clients`.
3. **Tipo (empresa/particular)** se muestra inline en el subline del header
   como badge pequeño además del select dentro del acordeón.
4. **2 secciones de "Dirección"** según pedido del usuario:
   - "Contacto y dirección personal": phone + address jsonb + país + ciudad
     (mismas columnas que el talent contact section).
   - "Datos de facturación": is_business + company_name (si business) +
     fiscal_id_type_id + company_tax_id + billing_address + billing_state +
     billing_postal_code.
5. **Sin tab de Documentos / Notas / Reviews** — no hay equivalente para
   clientes.
6. **Sin highlights de "Antigüedad" / "Última actividad"** — solo 3 stats
   pedidas (pedidos, pagado, adeudado).
7. **Currency**: stats consolidados en EUR (igual que talents). Si querés
   multi-currency en Phase 2, se agrupa por currency.

## Modelo de datos

### Schema actual (no se toca en Phase 1)

`client_profiles`: id, user_id, company_name, company_tax_id, status,
is_business, terms_accepted, billing_address, billing_state,
billing_postal_code, legacy_id, timestamps.

`profiles`: id, full_name, email, phone, address, preferred_country,
preferred_city, etc.

`orders`: id, client_id (FK profiles), payment_status, price_total, currency,
status, etc.

### Schema requerido para Phase 2 (NO migrar en Phase 1)

```sql
-- A. fiscal_id_type_id en client_profiles (alinea con talent_profiles)
ALTER TABLE client_profiles
  ADD COLUMN fiscal_id_type_id uuid REFERENCES fiscal_id_types(id);

-- B. Soft-delete column
ALTER TABLE client_profiles
  ADD COLUMN deleted_at timestamptz NULL;

CREATE INDEX idx_client_profiles_active ON client_profiles(deleted_at)
  WHERE deleted_at IS NULL;

-- C. client_payments (mismo modelo que talent_payments, invertido)
CREATE TABLE client_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  period_month date NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','paid','cancelled')),
  total_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  currency text NOT NULL,
  payment_method text NULL,
  payment_proof_url text NULL,
  paid_at timestamptz NULL,
  notes text NULL,
  created_by uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, period_month, currency)
);

CREATE TABLE client_payment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES client_payments(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  total numeric(12,2) NOT NULL CHECK (total >= 0),
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payment_id, order_id)
);

CREATE INDEX idx_client_payments_client ON client_payments(client_id);
CREATE INDEX idx_client_payments_status ON client_payments(status);
CREATE INDEX idx_client_payment_items_order ON client_payment_items(order_id);
```

## Estructura de archivos

```
src/features/clients/
├── (existente: actions/list-clients.ts, get-filter-options.ts, etc.)
├── (existente: components/clients-list.tsx, clients-table.tsx, clients-toolbar.tsx)
└── detail/                                          NUEVA SECCIÓN
    ├── types.ts                                     [foundation]
    ├── schemas.ts                                   [foundation]
    ├── index.ts                                     [foundation, ensamble final actualiza]
    ├── lib/
    │   ├── compose-client-detail.ts                 [foundation]
    │   └── compute-client-stats.ts                  [foundation]
    ├── actions/
    │   ├── get-client-detail.ts                     [foundation, REAL DB read]
    │   ├── get-client-stats.ts                      [foundation, MOCK]
    │   ├── get-client-orders.ts                     [foundation, MOCK]
    │   ├── get-client-payments.ts                   [foundation, MOCK]
    │   ├── get-payment-detail.ts                    [foundation, MOCK]
    │   ├── save-personal-data.ts                    [foundation, MOCK]
    │   ├── save-contact.ts                          [foundation, MOCK]
    │   ├── save-billing.ts                          [foundation, MOCK]
    │   └── delete-client.ts                         [foundation, MOCK]
    └── components/
        ├── header/                                  [Slice A — agente 1]
        │   ├── client-header.tsx
        │   ├── delete-client-modal.tsx
        │   └── client-type-badge.tsx
        ├── highlights/                              [Slice B — agente 2]
        │   └── highlights-row.tsx
        ├── tabs/
        │   ├── orders-tab.tsx                       [Slice C — agente 3]
        │   ├── payments/                            [Slice D — agente 4]
        │   │   ├── payments-tab.tsx
        │   │   └── payment-detail-sheet.tsx
        │   └── details/                             [Slice E — agente 5]
        │       ├── details-tab.tsx
        │       ├── personal-data-section.tsx
        │       ├── contact-section.tsx
        │       └── billing-section.tsx
        └── client-detail-tabs.tsx                   [final assembly — orquestador]
```

Ruta admin:
```
src/app/[locale]/(admin)/admin/clients/[id]/
└── page.tsx                                         [final assembly — orquestador]
```

## Slices paralelos

Después de S2 (foundation), 5 agentes corren en paralelo. Cada uno escribe
solo dentro de su subdirectorio.

### Slice A — Header (1 agente)
- `header/client-header.tsx`: avatar + nombre + email + teléfono + tipo
  (empresa/particular badge) + status badge + botón "Eliminar cliente".
- `header/delete-client-modal.tsx`: Sheet con texto de confirmación, input
  "escribir nombre del cliente para confirmar", botones Cancelar/Eliminar
  (variant destructive). Llama `deleteClient(clientId)`.
- `header/client-type-badge.tsx`: pequeño badge "Empresa" / "Particular".
- Props base:
  ```ts
  type Props = {
    client: ClientDetail;
    hints: HeaderHints;
    onDeleted: () => void; // navega a /admin/clients
  };
  ```
- Acciones consumidas: `deleteClient`.

### Slice B — Highlights (1 agente)
- `highlights/highlights-row.tsx`: 3 stats (Pedidos N | Total pagado X EUR |
  Adeudado X EUR (N órdenes)).
- Server component (sin `'use client'`).
- Props:
  ```ts
  type Props = {
    stats: ClientStats;
    hints: HighlightsHints;
  };
  ```

### Slice C — Tab Pedidos (1 agente)
- `tabs/orders-tab.tsx`: tabla con filtros (status, periodo, search). Cada
  row: # / Fecha / Servicio / Talent asignado / Status / Pago / Total.
- Acciones: `getClientOrders(input, locale)`.
- Props:
  ```ts
  type Props = {
    clientId: string;
    initialOrders: ClientOrderRow[];
    totalCount: number;
    hints: OrdersTabHints;
    locale: string;
  };
  ```
- Si LOC excede 250, splittear en `orders-toolbar.tsx` + `orders-table.tsx`
  como hicimos en talent.

### Slice D — Tab Pagos (1 agente)
- `tabs/payments/payments-tab.tsx`: tabla de pagos con stats de top
  (acumulado pagado, pendiente). Cada row con botón "Ver detalle".
- `tabs/payments/payment-detail-sheet.tsx`: Sheet read-only con header
  (mes, total, status, paid_at) + tabla de items + link a comprobante (mock).
- **Sin "Mark as paid"** — los pagos del cliente los registra el sistema
  (cuando el cliente paga), no los actualiza el admin. Read-only en Phase 1.
- Acciones: `getClientPayments(clientId)`, `getPaymentDetail(paymentId,
  locale)`.

### Slice E — Tab Detalle (1 agente, slice grande)
- `tabs/details/details-tab.tsx`: orchestrator del accordion (reutiliza
  patrón de `talents/detail/components/tabs/details/details-tab.tsx` —
  exporta `SectionShell` + `Field`).
- `tabs/details/personal-data-section.tsx`: full_name + phone + tipo
  (empresa/particular) + company_name (si is_business) → save action
  `savePersonalData`.
- `tabs/details/contact-section.tsx`: address + país + ciudad + email
  (read-only) → save action `saveContact`.
- `tabs/details/billing-section.tsx`: billing_address + billing_state +
  billing_postal_code + fiscal_id_type_id + company_tax_id → save action
  `saveBilling`.
- Acciones: `savePersonalData`, `saveContact`, `saveBilling`.
- Props base:
  ```ts
  type Props = {
    clientId: string;
    data: ClientDetailsData;
    context: ClientDetailContext; // countries, cities, fiscalIdTypes
    hints: DetailsTabHints;
    locale: string;
    onSectionSaved: () => void;
  };
  ```

## Final assembly (S3, orquestador)

- `components/client-detail-tabs.tsx`: monta header + highlights + Tabs con
  los 3 TabsContent. Estado `client` que se refetchea tras saves/delete.
- `index.ts`: re-exports finales.
- `src/app/[locale]/(admin)/admin/clients/[id]/page.tsx`:
  - `unstable_setRequestLocale(locale)`.
  - `getClientDetail(id, locale)` → si null, `notFound()`.
  - Promise.all: `getClientStats`, `getClientOrders` (page 0),
    `getClientPayments`, `getClientDetailsData`.
  - Resuelve hints `AdminClientDetail` con `getTranslations` (helper functions
    como en talent page).
  - Renderiza `<ClientDetailTabs ... />`.
- Modificar `src/features/clients/components/clients-table.tsx` para que la
  cell del nombre tenga `<Link href={\`/${locale}/admin/clients/${client.id}\`}>`.

## i18n — namespace `AdminClientDetail`

Mismo shape que `AdminTalentDetail` pero recortado:
- `backToList`, `notFoundTitle`, `notFoundDescription`
- `tabs`: orders / payments / details
- `header`: noPhone, noEmail, deleteButton, deleteTitle, deleteConfirmInputLabel,
  deleteConfirmInputPlaceholder, deleteConfirm, deleteCancel, deleteSuccess,
  deleteError, statusLabels (active, suspended), typeBusiness, typeIndividual
- `highlights`: ordersLabel, totalPaidLabel, balanceOwedLabel,
  pendingOrdersSuffix, none
- `orders`: column*, filter*, searchPlaceholder, empty, loadMore, loadingError,
  pageInfo
- `payments`: acumuladoLabel, pendienteLabel, columnMonth/Orders/Total/Status,
  rowViewDetail, empty, statusLabels (pending, approved, paid, cancelled),
  detailTitle, detailItemsLabel, detailDownloadProof, detailNoProof
- `details`: section.* (expand/collapse/edit/save/cancel/saveSuccess/saveError/
  unsavedPrompt), personalDataTitle, contactTitle, billingTitle, fullNameLabel,
  phoneLabel, emailLabel, addressLabel, countryLabel, cityLabel, isBusinessLabel,
  companyNameLabel, billingAddressLabel, billingStateLabel,
  billingPostalCodeLabel, fiscalIdTypeLabel, fiscalIdLabel, empty, notProvided

Aprox 70 keys × 5 locales = 350 strings. Menos que talent (~750).

## Phase 2 — Backend real (COMPLETADO 2026-05-04)

Sesión ejecutada secuencialmente sin agentes paralelos (cambios concentrados
en actions). Migrations + RPC + reemplazo de mocks + seed.

**Migrations aplicadas:**
- `client_profiles_add_fiscal_id_type_and_deleted_at`: agrega
  `fiscal_id_type_id uuid REFERENCES fiscal_id_types(id)` y `deleted_at
  timestamptz`. Índice partial `idx_client_profiles_active(created_at DESC)
  WHERE deleted_at IS NULL` para que el listado no escanee soft-deleted.
- `client_payments_tables`: crea `client_payments` y `client_payment_items`
  con CHECK constraints, FKs, UNIQUE (client_id, period_month, currency),
  índices y trigger `set_updated_at`.
- `delete_client_rpc`: función `public.delete_client(p_client_id uuid)` con
  `SECURITY DEFINER`. Atómicamente: locks la fila con `FOR UPDATE`, setea
  `client_profiles.deleted_at = now()` y `auth.users.banned_until =
  '2099-01-01'`. Idempotente: devuelve fila vacía si ya estaba deleted.
  EXECUTE granted to anon/authenticated/service_role.
- `client_payment_proofs_storage_bucket`: bucket privado
  `client-payment-proofs` para comprobantes (signed URLs vía
  `get-payment-detail`).

**Reads reemplazados por queries reales:**
- `get-client-stats.ts`: reads `client_payments` (paid + pending+approved =
  totalPaid / balanceOwed) y count(orders) + count(orders WHERE
  payment_status='pending'). EUR-only.
- `get-client-orders.ts`: paginated query a orders WHERE client_id =
  profiles.id, JOIN services + profiles (talent_name). Filtros server-side:
  status, fromDate/toDate, search por order_number numérico.
- `get-client-payments.ts`: lee `client_payments` ordenado por period_month
  DESC.
- `get-payment-detail.ts`: lee `client_payments` + JOIN
  `client_payment_items` + JOIN orders + JOIN services. Sign de
  `payment_proof_url` si está dentro del bucket privado, passthrough si es
  URL externa http(s).
- `get-client-details-data.ts`: ahora lee `client_profiles.fiscal_id_type_id`
  real.

**Writes reemplazados por DB updates:**
- `save-personal-data.ts`: update profiles (full_name, phone) +
  client_profiles (is_business, company_name). Auth opcional. Limpia
  `company_name` cuando se baja `is_business=false`.
- `save-contact.ts`: update profiles (email, address jsonb,
  preferred_country, preferred_city). Auth opcional.
- `save-billing.ts`: update client_profiles (fiscal_id_type_id,
  company_tax_id, billing_address, billing_state, billing_postal_code).
- `delete-client.ts`: invoca RPC `delete_client(client_id)`. Defense-in-depth:
  re-verifica el `confirmName` server-side contra el live profile.
  revalidatePath de listing + detail.

**Filtro de listado:**
- `src/features/clients/actions/list-clients.ts`: agregado `.is('deleted_at',
  null)` al query de paginación. Soft-deleted no aparecen en `/admin/clients`.

**Seed de datos de prueba** (cliente María García López):
- 6 orders (4 paid en abril/marzo, 2 pending en abril/mayo).
- 3 client_payments: abril paid €230, marzo paid €95, mayo pending €180.
- 6 client_payment_items linkeando orders ↔ payments.
- Stats reales: 6 pedidos · €325 pagados · €180 adeudado (1 orden pendiente).

**Verificación:**
- `pnpm exec tsc --noEmit` clean.
- `pnpm test` clean (360 tests).
- `NODE_ENV=production pnpm build` clean.
- Total feature: 2772 LOC. Archivo más grande: `types.ts` 247 LOC. Ningún
  `.tsx` > 200 LOC.

**Decisiones tomadas que difieren del spec original:**
1. **Soft-delete via RPC SECURITY DEFINER** en lugar de doble write desde
   server action (que requeriría service-role). Más limpio y atómico.
2. **Balance owed = sum(client_payments pending+approved)** en lugar de
   sum(orders.price_total WHERE payment_status='pending'). Alineado con el
   modelo de pagos consolidados.
3. **Bucket `client-payment-proofs` privado creado.** El admin solo lee
   (signed URL); el sistema externo es el que sube comprobantes.
4. **Email es read-only en la sección Contacto.** Cambiar email sin rotar
   `auth.users.email` desincronizaría auth — fuera de scope de Phase 2.

## Riesgos / cosas a vigilar

- **`client_profiles.is_business` puede no estar seteado** para clientes
  legacy. UI debe asumir false y mostrar campos de empresa colapsados.
- **`profiles.address` y `client_profiles.billing_address` tienen shapes
  distintos** (jsonb vs text plain). El billing es un text simple; el
  personal es jsonb. Documentar en el componente.
- **Soft-delete**: si el admin elimina y luego el cliente intenta loguear,
  Supabase devuelve error de banned. UX para Phase 2: mensaje claro.
- **Tamaño de feature**: 5 slices + foundation < 1500 LOC esperado (cliente
  tiene 3 tabs vs 6 del talent). Si crece, mover utilidades a
  `clients/detail/lib/`.
- **Eliminar Cliente con confirmación tipea-el-nombre**: patrón muy seguro,
  pero si el nombre tiene caracteres especiales puede ser difícil. Considerar
  fallback a "ELIMINAR" como confirmación si el nombre falla.

## Verificación end-to-end (Phase 1)

1. `pnpm exec tsc --noEmit` clean.
2. `pnpm test` clean.
3. `NODE_ENV=production pnpm build` clean.
4. Sanity de tamaño: ningún archivo > 250 LOC, total feature < 1500.
5. `pnpm dev` smoke:
   - `/es/admin/clients` muestra listado con el cliente de prueba.
   - Click en el nombre → `/es/admin/clients/{id}` carga.
   - Header muestra nombre, email, teléfono, tipo correctamente.
   - Highlights muestran números mock.
   - Tab Pedidos muestra rows mock.
   - Tab Pagos muestra rows mock.
   - Tab Detalle expande/colapsa secciones, edita y "guarda" (toast OK pero
     no persiste a DB en Phase 1).
   - Botón "Eliminar cliente" abre modal, requiere typed confirmation,
     "elimina" (toast OK + redirect, pero no persiste).
6. Multi-locale: `/en/admin/clients/{id}` y `/pt/admin/clients/{id}` cargan
   con strings traducidos.

## Referencias

- `docs/ADMIN_DETAIL_PATTERN.md` — patrón general de detalle admin.
- `docs/features/admin-talent-detail.md` — spec del talent detail (referencia
  de slice breakdown + DB design).
- `src/features/talents/detail/` — implementación de talent detail (copy &
  adapt).
