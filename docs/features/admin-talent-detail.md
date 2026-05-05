# Admin Talent Detail page (Phase E)

Página de detalle de un talento en el panel admin: `/admin/talents/[id]`. Diseñada
para que el admin operativo vea pedidos, pagos, documentos, datos completos,
notas timeline y reviews de un talento en una sola pantalla con tabs.

## Goal

Cuando el admin clickea una row en `/admin/talents`, navega a `/admin/talents/[id]`
y ve toda la información del talento organizada en un layout sticky (Alternativa C).

Permite al admin:
- Cambiar el status del talento vía modal explícito (acción crítica que afecta
  asignaciones futuras a órdenes).
- Asignar/quitar etiquetas (`talent_tags`).
- Ver y editar datos personales/contacto/dirección/situación profesional/servicios/
  pagos/idiomas/otros (registro + onboarding) por sección con accordion.
- Ver tabla de pedidos del talento con drill-down a `/admin/orders/[id]`.
- Gestionar pagos: ver mensual, marcar como pagado (con upload de comprobante).
- Ver documentos cargados por el talento durante onboarding.
- Tomar notas timeline (con autor + fecha).
- Ver reviews agregadas por servicio (rating promedio + count).

## Out of scope (NO se construye en Phase E)

- Workflow de aprobación de talentos (admin acciona el status manualmente; sin
  flow guiado).
- Sistema de reviews "real" del cliente — usamos `orders.rating` agregado, no
  capturamos nuevos reviews del cliente.
- Editor admin de talent_tags (ya existe en `/admin/talent-tags`).
- Drill-down de "pedido individual" — `/admin/orders/[id]` queda como TODO
  (link existe, página real es Phase futura).
- Email/notificaciones cuando cambia el status del talento.
- Auditoría detallada de cambios de status (más allá de las notas timeline
  que pueden tener entries `system`).

## Layout final aprobado (Alternativa C)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Talentos                                              [STICKY HEADER]   │
│                                                                           │
│ ┌────┐  Juan Perez Garcia                  [● Activo] [Actualizar status]│
│ │ JP │  +34 600 123 456 · juan@mail.com · ES Madrid                     │
│ │56px│  [diseno] [carpinteria] [bilingue] [+2]                          │
│ └────┘                                                                   │
├──────────────────────────────────────────────────────────────────────────┤
│  Pedidos 23   |   ★ 4.7 (19)   |   Antiguedad 8m   |   Última act 3d    │
├──────────────────────────────────────────────────────────────────────────┤
│ [Pedidos] [Pagos] [Documentos] [Detalles] [Notas] [Reviews]              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Contenido del tab activo (scrollable)                                   │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Header sticky** (~150px): avatar 56px + nombre + subline + tags chips +
  status badge + botón "Actualizar status" (explícito, NO badge clickeable).
- **Highlights row inline** (~40px): 4 stats con separadores.
- **Tabs horizontales** en orden por frecuencia de uso.
- Status badge se muestra read-only; la acción que cambia status es el botón
  separado (fricción intencional para acción crítica).

## Decisiones de diseño tomadas

1. **Tab default = Pedidos** (operativo es lo más usado).
2. **Status modal** con dropdown 6 valores + confirmación + nota opcional →
   nota de tipo `system` se agrega al timeline de Notas.
3. **Highlights inline** (no cards): `Pedidos N | ★ X.X (count) | Antigüedad Xm | Última act Xd`.
4. **Accordion-with-preview en Detalles**: cada sección colapsada muestra
   2-3 datos clave; expandida muestra todo en read-only; click "Editar" entra
   modo edit con inputs + Guardar/Cancelar al pie de la sección.
5. **Una sola sección de Detalles en modo edit a la vez**. Si hay cambios
   sin guardar y se intenta editar otra, prompt de confirmación.
6. **Side sheet** para "Marcar pago como pagado" (multi-step: tipo de pago →
   datos → upload comprobante → confirmar) y "Ver detalle de pago".
7. **Modal** para "Actualizar status" (decisión crítica, fricción intencional).
8. **Nueva ruta** `/admin/orders/[id]` para drill-down de pedidos (TODO Phase
   futura).
9. **Nota de Notas split**: composer pinned arriba + timeline DESC abajo.
10. **Reviews = agregación de orders.rating**, no tabla nueva. Query:
    `SELECT service_id, AVG(rating), COUNT(*) FROM orders WHERE talent_id = ?
    GROUP BY service_id`.
11. **Documentos = extracción de talent_services.form_data** (no usa
    `talent_documents` table). Recorrer talent_services + por cada uno extraer
    talent_questions tipo `file` + URL desde form_data[question.key].
12. **6 status del talento**: `registered, evaluation, active, archived,
    excluded, inactive`. Migración del enum existente (4 → 6 valores).
13. **ID en URL** = `talent_profiles.id`.
14. **Tab Notas timeline** = tabla nueva `talent_notes` (autor + body +
    timestamp + opcional pinned).
15. **`talent_payments` y `talent_payment_items`** = tablas nuevas.

## Modelo de datos

### Migrations necesarias (Phase E - S1)

```sql
-- A. Status migration: 4 → 6 valores
ALTER TABLE talent_profiles DROP CONSTRAINT talent_profiles_status_check;

UPDATE talent_profiles SET status = CASE
  WHEN status = 'pending'   AND onboarding_completed_at IS NULL     THEN 'registered'
  WHEN status = 'pending'   AND onboarding_completed_at IS NOT NULL THEN 'evaluation'
  WHEN status = 'approved'  THEN 'active'
  WHEN status = 'rejected'  THEN 'excluded'
  WHEN status = 'suspended' THEN 'inactive'
  ELSE status
END;

ALTER TABLE talent_profiles
  ADD CONSTRAINT talent_profiles_status_check
  CHECK (status IN ('registered','evaluation','active','archived','excluded','inactive'));

-- Re-formular el check de country/city: solo registered/excluded permiten null.
ALTER TABLE talent_profiles DROP CONSTRAINT talent_profiles_check;
ALTER TABLE talent_profiles
  ADD CONSTRAINT talent_profiles_check CHECK (
    status IN ('registered','excluded')
    OR (country_id IS NOT NULL AND city_id IS NOT NULL)
  );

-- B. talent_payments cabecera
CREATE TABLE talent_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES talent_profiles(id) ON DELETE CASCADE,
  period_month date NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','paid','cancelled')),
  total_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  total_hours numeric(8,2) NULL CHECK (total_hours IS NULL OR total_hours >= 0),
  currency text NOT NULL,
  payment_method text NULL,
  payment_proof_url text NULL,
  paid_at timestamptz NULL,
  notes text NULL,
  created_by uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (talent_id, period_month, currency)
);
CREATE INDEX idx_talent_payments_talent ON talent_payments(talent_id);
CREATE INDEX idx_talent_payments_status ON talent_payments(status);

-- C. talent_payment_items líneas
CREATE TABLE talent_payment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES talent_payments(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  hours numeric(8,2) NULL CHECK (hours IS NULL OR hours >= 0),
  unit_amount numeric(12,2) NULL CHECK (unit_amount IS NULL OR unit_amount >= 0),
  total numeric(12,2) NOT NULL CHECK (total >= 0),
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payment_id, order_id)
);
CREATE INDEX idx_talent_payment_items_order ON talent_payment_items(order_id);

-- D. talent_notes timeline
CREATE TABLE talent_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES talent_profiles(id) ON DELETE CASCADE,
  author_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  body text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_talent_notes_talent ON talent_notes(talent_id, created_at DESC);

-- E. Storage bucket para payment_proof_url
INSERT INTO storage.buckets (id, name, public) VALUES
  ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;
```

RLS policies del bucket `payment-proofs`: SELECT solo admin (via staff_profiles
EXISTS), uploads via service-role en server actions.

### Tablas que ya existen (no se tocan)

- `profiles` (full_name, email, phone, gender, birth_date, address jsonb,
  preferred_*, etc.)
- `talent_profiles` (id, user_id, status, internal_notes, professional_status,
  preferred_payment, has_social_security, fiscal_id, fiscal_id_type_id,
  previous_experience, marketing_consent, terms_accepted, onboarding_completed_at)
- `orders` (talent_id → profiles.user_id, talent_amount, rating int CHECK 1-5)
- `talent_services` (PK talent_id+service_id+country_id, unit_price, form_data)
- `talent_service_subtypes`
- `talent_spoken_languages`
- `survey_responses`
- `talent_tags` + `talent_tag_assignments`
- `service_subtypes`, `service_subtype_groups`, `service_subtype_group_assignments`
- `services` (i18n, talent_questions jsonb)

## Estructura de archivos del feature

Para que los agentes paralelos no se pisen, cada slice tiene su subdirectorio
disjunto. El orquestador prepara la foundation antes y el ensamble final
después.

```
src/features/talents/
├── (existente: actions/list-talents.ts, get-filter-options.ts, etc.)
├── (existente: components/talents-list.tsx, talents-table.tsx, talents-toolbar.tsx)
└── detail/                                          NUEVA SECCIÓN
    ├── types.ts                                     [foundation]
    ├── schemas.ts                                   [foundation]
    ├── index.ts                                     [foundation, ensamble final actualiza]
    ├── lib/
    │   ├── compose-talent-detail.ts                 [foundation]
    │   ├── extract-documents-from-services.ts       [foundation]
    │   └── status-transitions.ts                    [foundation]
    ├── actions/
    │   ├── get-talent-detail.ts                     [foundation]
    │   ├── get-talent-orders.ts                     [foundation]
    │   ├── get-talent-payments.ts                   [foundation]
    │   ├── get-payment-detail.ts                    [foundation]
    │   ├── get-talent-documents.ts                  [foundation]
    │   ├── get-talent-details-data.ts               [foundation]
    │   ├── get-talent-notes.ts                      [foundation]
    │   ├── get-talent-reviews.ts                    [foundation]
    │   ├── update-talent-status.ts                  [foundation]
    │   ├── update-talent-tags.ts                    [foundation]
    │   ├── save-personal-data.ts                    [foundation]
    │   ├── save-contact.ts                          [foundation]
    │   ├── save-professional-situation.ts           [foundation]
    │   ├── save-talent-services.ts                  [foundation]
    │   ├── save-payment-prefs.ts                    [foundation]
    │   ├── save-languages.ts                        [foundation]
    │   ├── save-other-survey.ts                     [foundation]
    │   ├── mark-payment-as-paid.ts                  [foundation]
    │   ├── create-talent-note.ts                    [foundation]
    │   └── pin-talent-note.ts                       [foundation]
    └── components/
        ├── header/                                  [Slice A — agente 1]
        │   ├── talent-header.tsx
        │   ├── status-badge.tsx
        │   ├── update-status-modal.tsx
        │   └── talent-tags-display.tsx
        ├── highlights/                              [Slice B — agente 2]
        │   └── highlights-row.tsx
        ├── tabs/
        │   ├── orders-tab.tsx                       [Slice C — agente 3]
        │   ├── payments/                            [Slice D — agente 4]
        │   │   ├── payments-tab.tsx
        │   │   ├── mark-as-paid-sheet.tsx
        │   │   └── payment-detail-sheet.tsx
        │   ├── documents-tab.tsx                    [Slice E — agente 5]
        │   ├── details/                             [Slice F — agente 6]
        │   │   ├── details-tab.tsx
        │   │   ├── personal-data-section.tsx
        │   │   ├── contact-section.tsx
        │   │   ├── professional-situation-section.tsx
        │   │   ├── talent-services-section.tsx
        │   │   ├── payment-prefs-section.tsx
        │   │   ├── languages-section.tsx
        │   │   └── other-survey-section.tsx
        │   ├── notes-tab.tsx                        [Slice G — agente 7]
        │   └── reviews-tab.tsx                      [Slice H — agente 8]
        └── talent-detail-tabs.tsx                   [final assembly — orquestador]
```

Ruta admin:
```
src/app/[locale]/(admin)/admin/talents/[id]/
└── page.tsx                                         [final assembly — orquestador]
```

Modificación al sidebar (final assembly):
- `src/features/talents/components/talents-table.tsx`: agregar `<Link>` a cada row → `/admin/talents/[id]`.

## UX por bloque

### Header (Slice A)

- Avatar 56px circular con iniciales si no hay `photo_url`.
- Nombre completo, h1.
- Subline: `phone · email · 🇪🇸 country.name`.
- Tags como chips (pill badges) clickeables → opens un Popover con CheckboxList
  de `talent_tags` para asignar/quitar.
- Status badge: text + color por valor (verde Activo, gris Inactivo, ámbar
  Evaluación, rojo Excluido, azul Registrado, gris Archivado).
- Botón "Actualizar status" (variant primary, prominent) → abre modal.

**Update Status Modal**:
- Dropdown con los 6 status traducidos.
- Textarea opcional "Razón del cambio".
- Botones Cancelar / Confirmar.
- Confirmar → `update-talent-status` action. Si OK:
  - Crea entry en `talent_notes` con `is_system=true`, body `Status cambiado:
    {old} → {new}. Razón: {motivo}` (si motivo presente).
  - Toast "Status actualizado".
  - Cierra modal, header actualiza badge.

### Highlights row (Slice B)

Una sola fila con separadores `|`. Cada item:
- `Pedidos {N}` (count de orders del talento)
- `★ {avg.toFixed(1)} ({count})` (rating promedio + count, agregado de orders.rating WHERE NOT NULL)
- `Antigüedad {Xm | Xd}` (desde `talent_profiles.created_at`)
- `Última act {Xd}` (desde MAX de orders.updated_at, o talent_profiles.updated_at, lo más reciente)

Si N=0 para algún campo, mostrar `—`.

### Tab Pedidos (Slice C)

- Header del tab: filtros (status dropdown, periodo dropdown, servicio dropdown)
  + buscador.
- Tabla columnas: # Pedido / Fecha / Servicio / Cliente / Status / Pago / $ Talent.
- Cada row: `<Link>` a `/admin/orders/[id]` (TODO Phase futura — link existe pero la página
  destino aún no construida; placeholder página 404 OK).
- Default sort: fecha DESC.
- Paginación server-side (50 por página).

### Tab Pagos (Slice D)

- Header del tab: método de pago preferido (read-only desde
  `talent_profiles.preferred_payment`) con botón "Editar" (futuro, no necesario en S1).
- Stats inline: `Acumulado histórico: X EUR | Pendiente: X EUR (N órdenes)` + botón
  "Marcar como pagado" (variant primary, abre side sheet con form para crear un
  nuevo `talent_payment` con todas las orders pendientes consolidadas).
- Tabla: Mes / Órdenes / Bruto / Comisión / Neto / Estado / Acción.
- Acción por row:
  - Si `status='pending'`: botón inline "Marcar pagado" (abre el sheet).
  - Si `status='paid'`: botón "Ver detalle" (abre el sheet en read-mode).

**Mark As Paid Sheet** (multi-step):
- Step 1: tipo de pago dropdown (`transfer` / `account_balance` / `cash` / `other`).
- Step 2: si `transfer`, input para referencia/IBAN; si `account_balance`, info
  read-only "Crédito acreditado al balance del talento"; etc.
- Step 3: file upload del comprobante (reusa `FileInputRenderer` de
  `@/shared/components/question-renderers`).
- Confirmar → `mark-payment-as-paid` action: upload file a Storage bucket
  `payment-proofs/{talent_id}/{payment_id}/{filename}`, update `talent_payments`
  con `status=paid`, `payment_method`, `payment_proof_url`, `paid_at=now()`.

**Payment Detail Sheet** (read-mode):
- Cabecera: mes, total, status, fecha pago.
- Tabla de items (`talent_payment_items` JOIN orders): order_number, fecha,
  servicio, hours, unit_amount, total.
- Link al comprobante (descarga vía signed URL).

### Tab Documentos (Slice E)

- Tabla columnas: Documento (label de la talent_question) / Servicio asociado
  (nombre del service) / Subido (fecha) / Acción.
- Acción: botón descargar (signed URL del file en Storage).
- Si el talento no completó onboarding o no tiene servicios con preguntas tipo
  `file`, mostrar empty state.
- Lógica: el helper `extract-documents-from-services.ts` recorre los
  `talent_services` + `services.talent_questions` filtrando type='file' +
  resuelve URL desde `talent_services.form_data[question.key]`.

### Tab Detalles (Slice F)

7 secciones en accordion. Una sola abierta a la vez.

Cada sección tiene 3 modos:
1. **Colapsada (default)**: header con título + chevron + preview text (ej.
   "DNI: 12345678X · Madrid").
2. **Expandida read-mode**: muestra todos los campos en formato read-only +
   botón "Editar".
3. **Expandida edit-mode**: inputs editables + botones "Guardar" / "Cancelar"
   al pie.

Si el admin clickea otro accordion mientras hay cambios sin guardar, prompt
("Tienes cambios sin guardar. ¿Descartar?").

Secciones:
- **Datos personales**: gender, birth_date, full_name (↗ profiles).
- **Contacto y dirección**: phone, email, preferred_contact, address jsonb,
  preferred_country, preferred_city (↗ profiles).
- **Situación profesional**: professional_status, previous_experience
  (↗ talent_profiles).
- **Servicios brindados**: tabla read-only de talent_services (service_name,
  country, unit_price); editar abre sheet con multi-select de servicios + per-row
  unit_price + answers.
- **Pagos preferenciales**: preferred_payment, has_social_security
  (↗ talent_profiles), fiscal_id_type_id, fiscal_id (↗ talent_profiles).
- **Idiomas**: lista de talent_spoken_languages con chips removibles + add.
- **Otros (survey)**: respuestas al `survey_questions` activos
  (↗ survey_responses).

### Tab Notas (Slice G)

- Top: composer pinned (Textarea + botón "Agregar nota").
- Timeline DESC: cada entry muestra:
  - Hora relativa ("hace 3 horas") o fecha absoluta si > 7 días.
  - Autor (`profiles.full_name` o "sistema" si `is_system=true`).
  - Body (text plain, line-wraps).
  - Si `pinned=true`: ícono pin + va arriba del timeline.
  - Notas system se muestran con estilo distinto (gris, ícono).

### Tab Reviews (Slice H)

- Tabla agregada por servicio:
  - Servicio (nombre).
  - Rating promedio (estrellas + número decimal `4.7` + count `(19 reviews)`).
  - Órdenes completadas (count de orders donde status='completado').
- Order DESC por rating o por count, decidir.
- Empty state si el talento no tiene orders con rating.

## Casos de borde

### Status: paso de "active" a "inactive"
- El talento NO desaparece. Sigue siendo visible en `/admin/talents`.
- Lógica futura: filtrar talents inactivos en queries de "asignar talent a
  order" (ej. matchmaker). Esto NO se construye en Phase E pero el data está
  listo para consumirlo.

### Status: paso a "archived" o "excluded"
- Mismo manejo que "inactive" — no se borra, queda con status.
- Diferencia semántica: `excluded` = bloqueado por la org (incidente);
  `archived` = el talento ya no opera (jubilación, etc.); `inactive` = pausa
  temporal (vacaciones, problema de salud).

### Cambios sin guardar en accordion
- Tracking client-side (`isDirty` por sección).
- Si el admin clickea otra sección o intenta cambiar de tab, prompt antes
  de descartar.

### Documentos sin servicios asignados
- Empty state con texto: "Este talento aún no completó el onboarding o no
  cargó documentos en sus servicios".

### `orders.rating` NULL
- En reviews, filtrar `WHERE rating IS NOT NULL` en el AVG.
- En highlights, si todos NULL, mostrar `★ — (0)`.

### Talento sin onboarding completado
- Header: badge "Sin onboarding" en vez de status normal.
- Algunas secciones de Detalles tendrán campos vacíos. Cada sección debe
  manejar el null gracefully.

### Status migration de DB con rows existentes
- El UPDATE inicial mapea cada talento al nuevo status según
  `onboarding_completed_at` (NULL → registered, NOT NULL → evaluation).
- Verificar count antes/después con SELECT COUNT GROUP BY status.

## Sesiones planificadas

### Foundation (orquestador, secuencial)

#### S1 — DB foundation
- Migration A: status enum + check rebuild (4 → 6 valores).
- Migration B: CREATE talent_payments.
- Migration C: CREATE talent_payment_items.
- Migration D: CREATE talent_notes.
- Migration E: CREATE bucket payment-proofs (sin RLS aún — se difiere a S2 final
  cuando el flujo de upload esté).
- Regenerar `database.types.ts`.
- Verificar typecheck.
- ~80 SQL.

#### S2 — Feature foundation: types + schemas + libs + ALL actions

**Files que el orquestador crea (todos en una sesión secuencial)**:
- `detail/types.ts`: TalentDetail, TalentOrderRow, TalentPayment, TalentPaymentItem, TalentNote, TalentReview, etc.
- `detail/schemas.ts`: Zod por cada save action.
- `detail/lib/compose-talent-detail.ts`, `extract-documents-from-services.ts`,
  `status-transitions.ts`.
- TODOS los actions (read + write):
  - 8 read actions (get-*).
  - 9 save/update actions (update-talent-status, update-talent-tags,
    save-personal-data, save-contact, save-professional-situation,
    save-talent-services, save-payment-prefs, save-languages, save-other-survey).
  - 2 specific actions (mark-payment-as-paid, create-talent-note,
    pin-talent-note).
- `detail/index.ts` con exports parciales (los componentes UI se exportan
  cuando estén creados).
- i18n: namespace `AdminTalentDetail` completo en los 5 locales (con TODOS
  los strings que cualquier slice necesita).
- ~700 LOC.

**Importante**: en esta sesión yo (orquestador) escribo TODOS los Hints types
exportados en `types.ts` (`HeaderHints`, `HighlightsHints`, `OrdersTabHints`,
`PaymentsTabHints`, `DocumentsTabHints`, `DetailsTabHints`, `NotesTabHints`,
`ReviewsTabHints`, `UpdateStatusHints`, `MarkAsPaidHints`, etc.) para que cada
slice tenga el contrato de props ya definido y no improvise nombres.

### Slices paralelos (8 agentes, simultaneous)

Después de S2, los siguientes 8 agentes corren en paralelo. Cada uno tiene un
subdirectorio único dentro de `detail/components/`:

#### Slice A — Header (1 agente)
**Files que crea**:
- `detail/components/header/talent-header.tsx`
- `detail/components/header/status-badge.tsx`
- `detail/components/header/update-status-modal.tsx`
- `detail/components/header/talent-tags-display.tsx`

**Props base**:
```ts
type Props = {
  talent: TalentDetail;
  availableTags: TalentTagOption[];
  hints: HeaderHints;
  onStatusChanged: () => void;       // re-fetch
  onTagsChanged: () => void;          // re-fetch
};
```

**Acciones que consume**: `updateTalentStatus`, `updateTalentTags`.

#### Slice B — Highlights row (1 agente)
**Files que crea**:
- `detail/components/highlights/highlights-row.tsx`

**Props base**:
```ts
type Props = {
  stats: { totalOrders: number; ratingAvg: number | null; ratingCount: number;
           ageMonths: number; lastActivityDays: number | null; };
  hints: HighlightsHints;
};
```

**Acciones**: ninguna (datos vienen como prop precalculado, computed por
orquestador en page.tsx).

#### Slice C — Tab Pedidos (1 agente)
**Files que crea**:
- `detail/components/tabs/orders-tab.tsx`

**Props base**:
```ts
type Props = {
  talentId: string;
  initialOrders: TalentOrderRow[];
  totalCount: number;
  hints: OrdersTabHints;
  locale: string;
};
```

**Acciones que consume**: `getTalentOrders` (con filtros + paginación).

#### Slice D — Tab Pagos (1 agente, slice más grande)
**Files que crea**:
- `detail/components/tabs/payments/payments-tab.tsx`
- `detail/components/tabs/payments/mark-as-paid-sheet.tsx`
- `detail/components/tabs/payments/payment-detail-sheet.tsx`

**Props base**:
```ts
type Props = {
  talentId: string;
  preferredPayment: string | null;
  initialPayments: TalentPayment[];
  initialStats: { acumulado: number; pendiente: number; pendingOrders: number };
  hints: PaymentsTabHints;
  currency: string;
};
```

**Acciones que consume**: `getTalentPayments`, `getPaymentDetail`,
`markPaymentAsPaid`.

#### Slice E — Tab Documentos (1 agente)
**Files que crea**:
- `detail/components/tabs/documents-tab.tsx`

**Props base**:
```ts
type Props = {
  documents: TalentDocumentEntry[];   // ya extraídos via extract-documents-from-services
  hints: DocumentsTabHints;
};
```

**Acciones**: ninguna directa (datos pre-cargados via `getTalentDocuments`).

#### Slice F — Tab Detalles (1 agente, slice grande)
**Files que crea**:
- `detail/components/tabs/details/details-tab.tsx`
- `detail/components/tabs/details/personal-data-section.tsx`
- `detail/components/tabs/details/contact-section.tsx`
- `detail/components/tabs/details/professional-situation-section.tsx`
- `detail/components/tabs/details/talent-services-section.tsx`
- `detail/components/tabs/details/payment-prefs-section.tsx`
- `detail/components/tabs/details/languages-section.tsx`
- `detail/components/tabs/details/other-survey-section.tsx`

**Props base** (al details-tab):
```ts
type Props = {
  talentId: string;
  data: TalentDetailsData;            // pre-cargado via getTalentDetailsData
  context: TalentDetailContext;       // catálogos: countries, cities, services, languages, surveys
  hints: DetailsTabHints;
  locale: string;
  onSectionSaved: () => void;         // re-fetch
};
```

**Acciones que consume**: `savePersonalData`, `saveContact`,
`saveProfessionalSituation`, `saveTalentServices`, `savePaymentPrefs`,
`saveLanguages`, `saveOtherSurvey`.

#### Slice G — Tab Notas (1 agente)
**Files que crea**:
- `detail/components/tabs/notes-tab.tsx`

**Props base**:
```ts
type Props = {
  talentId: string;
  initialNotes: TalentNote[];
  hints: NotesTabHints;
  currentUserName: string;            // para mostrar "tú" en composer
};
```

**Acciones que consume**: `getTalentNotes`, `createTalentNote`,
`pinTalentNote`.

#### Slice H — Tab Reviews (1 agente)
**Files que crea**:
- `detail/components/tabs/reviews-tab.tsx`

**Props base**:
```ts
type Props = {
  reviews: TalentReviewByService[];   // pre-agregado via getTalentReviews
  hints: ReviewsTabHints;
};
```

**Acciones**: ninguna directa.

### Final assembly (orquestador, secuencial)

#### S3 — TalentDetailTabs orchestrator + page.tsx + sidebar wiring

**Files**:
- `detail/components/talent-detail-tabs.tsx`: orchestrator que monta header
  sticky + highlights + Tabs con TabsContent por cada tab. Maneja currentTab
  state, re-fetch tras saves.
- `detail/index.ts`: exports finales (componentes + types).
- `src/app/[locale]/(admin)/admin/talents/[id]/page.tsx`: server component que:
  - Carga `getTalentDetail(id)` (header + meta).
  - Carga datos initial de las 6 tabs en Promise.all.
  - Construye `WizardHints` desde `getTranslations`.
  - Renderiza `<TalentDetailTabs>`.
- `src/features/talents/components/talents-table.tsx`: agregar `<Link>` a cada
  row → `/admin/talents/[id]`.
- Verificar typecheck + tests + build.
- ~250 LOC.

**Total estimado de Phase E**: ~3000 LOC distribuidas (foundation 700 +
slices 1500-1800 + assembly 250 + DB/i18n).

### Dependencias entre sesiones

```
S1 (DB) ──▶ S2 (foundation) ──┬──▶ Slice A
                              ├──▶ Slice B
                              ├──▶ Slice C
                              ├──▶ Slice D
                              ├──▶ Slice E
                              ├──▶ Slice F
                              ├──▶ Slice G
                              └──▶ Slice H ──▶ S3 (assembly)
```

S1 → S2 secuenciales (S2 necesita types regenerados de la migration).
Después de S2, los 8 slices son **completamente paralelizables**.
S3 después de que TODOS los slices terminen.

## Riesgos

- **Status migration con datos existentes**: el UPDATE inicial mapea según
  `onboarding_completed_at`. Verificar count antes/después y comunicar al
  user. En la DB actual probable que solo haya 1 row (el talento de prueba)
  → riesgo bajo.
- **Bucket `payment-proofs` RLS**: lo creamos en S1 sin policies. En S3 al
  ensamblar, definir policies (admin SELECT all via staff_profiles, uploads
  vía service_role). Si nos olvidamos, el bucket queda inaccesible (lo cual
  es seguro pero rompe el flow).
- **Cross-feature imports en talent-tags**: el header necesita listar
  `talent_tags` activos. Si hacemos un import directo a `@/features/talent-tags`,
  rompe boundaries. Solución: cargar desde el page.tsx (capa app, allowed) y
  pasar como `availableTags: TalentTagOption[]` prop.
- **`/admin/orders/[id]` no existe**: los links de tab Pedidos van a 404.
  Mitigación: en S3 dejar el link pero con `prefetch={false}` o un comment
  TODO. El user lo construye en Phase futura.
- **Bucket de documentos**: los URLs en `talent_services.form_data` apuntan
  al bucket `order-attachments` (creado para `service_hire`). Para download,
  generar signed URL desde el server action. Asegurar que el path tenga el
  formato esperado.
- **Re-fetch tras saves**: el orchestrator re-carga via los get-* actions
  cada vez que hay un save. Si la queries son caras, considerar invalidar
  solo lo afectado (ej: si actualizo notas, solo re-fetch notas). MVP: re-fetch
  toda la pantalla con un `router.refresh()` o triggers manuales.
- **i18n volumen**: ~150 keys × 5 locales = 750 strings. Volumen alto pero
  manejable. Agrupar por bloque para legibilidad.

## Referencias

- Pattern reutilizable: `src/features/services/components/` + `service-edit-tabs.tsx`
- Question framework: `src/shared/components/question-renderers/` + `src/shared/lib/questions/`
- Document/file pattern: `src/shared/components/question-renderers/file-input.tsx`
- Dialog/Sheet pattern: `src/shared/components/confirm-dialog.tsx` + `src/components/ui/sheet.tsx`
- Spec análogo Phase D: `docs/features/talent-onboarding.md`
