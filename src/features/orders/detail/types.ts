import type { Question } from '@/shared/lib/questions/types';
import type { OrderStatus, OrderScheduleType } from '../types';

// ── Status helpers ──────────────────────────────────────────

export const ORDER_PAYMENT_STATUSES = [
  'sin_pago',
  'pending',
  'pendiente_de_pago',
  'paid',
  'cancelled',
  'overdue',
] as const;
export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUSES)[number];

export const RECURRENCE_TYPES: OrderScheduleType[] = [
  'once',
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'semiannual',
  'annual',
];

// ── Header / page meta ──────────────────────────────────────

export type OrderTagOption = { id: string; name: string };

export type OrderClientSummary = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

export type StaffMemberSummary = {
  id: string;
  full_name: string | null;
};

export type OrderDetail = {
  id: string;
  order_number: number;
  service_id: string | null;
  service_name: string | null;
  status: OrderStatus;
  payment_status: OrderPaymentStatus | null;
  appointment_date: string | null;
  schedule_type: OrderScheduleType;
  schedule_summary: string;       // human-readable summary, computed Phase 1 mock
  estimated_duration_minutes: number | null;
  start_time: string | null;      // HH:mm
  end_time: string | null;        // HH:mm
  price_total: number;
  price_subtotal: number;
  price_tax: number;
  price_tax_rate: number;
  currency: string;
  created_at: string | null;
  updated_at: string | null;
  staff_member: StaffMemberSummary | null;
  client: OrderClientSummary;
  tags: OrderTagOption[];         // Phase 1 mock
  talents_needed: number;
};

// ── Tab Servicio ────────────────────────────────────────────

export type LanguageValues = {
  preferred_language: string | null;
};

export type AddressValues = {
  service_address: string | null;
  service_city_id: string | null;
  service_postal_code: string | null;
};

export type ServiceAnswerEntry = {
  question_key: string;
  question_label: string;
  question_type: Question['type'];
  value: unknown;
};

export type ServiceAnswersValues = {
  service_id: string | null;
  service_name: string | null;
  questions: Question[];           // service.questions (client-facing)
  answers: Record<string, unknown>;
};

export type RecurrenceValues = {
  schedule_type: OrderScheduleType;
  repeat_every: number;
  weekdays: number[];              // 0=Sunday … 6=Saturday
  start_date: string | null;       // ISO date
  end_date: string | null;
  time_window_start: string | null; // HH:mm
  time_window_end: string | null;
  hours_per_session: number | null;
};

export type NotesValues = {
  notes: string | null;
  talents_needed: number;
};

export type ServiceTabData = {
  language: LanguageValues;
  address: AddressValues;
  serviceAnswers: ServiceAnswersValues;
  recurrence: RecurrenceValues;
  notesData: NotesValues;
};

export type ServiceTabContext = {
  spokenLanguages: { code: string; name: string }[];
  countries: { id: string; code: string; name: string }[];
  cities: { id: string; country_id: string; name: string }[];
};

// ── Tab Especialistas ───────────────────────────────────────

export type AssignedTalent = {
  id: string;                   // talent_profiles.id
  user_id: string;              // profiles.id
  full_name: string | null;
  email: string | null;
  phone: string | null;
  rating_avg: number | null;    // for this service
  rating_count: number;
  completed_count: number;      // count of completed orders for this service
  is_primary: boolean;
};

export type TalentSearchResult = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  rating_avg: number | null;
  completed_count: number;
  /**
   * True when the talent has a `talent_services` row for the order's
   * service_id + country_id — i.e. the talent has explicitly registered
   * for this service in this market. The admin can still assign
   * non-qualified talents, but qualified ones rank first.
   */
  is_qualified: boolean;
};

// ── Tab Horas ───────────────────────────────────────────────

export type HoursLogKind = 'hours' | 'kilometers' | 'other';

export type HoursLogEntry = {
  id: string;
  kind: HoursLogKind;
  description: string | null;
  unit_price: number;
  reported_qty: number;
  confirmed_qty: number | null;
  reported_by_name: string | null;
  confirmed_by_name: string | null;
};

export type HoursTabData = {
  totalHoursLog: HoursLogEntry;        // singleton row "Total horas"
  totalKilometersLog: HoursLogEntry;   // singleton row "Total km"
  otherLogs: HoursLogEntry[];
  /** number of hours the client originally requested (read-only). */
  hoursClient: number;
};

// ── Tab Pagos ───────────────────────────────────────────────

export type BillingLine = {
  id: string;
  description: string;
  unit_price: number;
  qty: number;
  discount_pct: number;
  total: number;
};

export type ClientBillingState = {
  lines: BillingLine[];
  subtotal: number;
  tax_rate: number;       // 21%
  tax_amount: number;
  total: number;
  currency: string;
  invoiced: boolean;
  total_paid: number;
  total_owed: number;
};

export type TalentBillingBlock = {
  talent_id: string;
  talent_name: string | null;
  lines: BillingLine[];
  subtotal: number;
  total: number;
  currency: string;
  invoiced: boolean;
};

export type BillingTabData = {
  clientBilling: ClientBillingState;
  talentBlocks: TalentBillingBlock[];
};

// ── Tab Documentos ──────────────────────────────────────────

export type OrderDocumentEntry = {
  question_key: string;
  question_label: string;
  url: string;
  uploaded_at: string | null;
};

// ── Tab Actividad ───────────────────────────────────────────

export type OrderActivityNote = {
  id: string;
  body: string;
  is_system: boolean;
  author_id: string | null;
  author_name: string | null;
  created_at: string;
};

// ── Hints (i18n strings injected) ───────────────────────────

export type OrderStatusLabels = Record<OrderStatus, string>;
export type ScheduleTypeLabels = Record<OrderScheduleType, string>;

export type HeaderHints = {
  statusLabels: OrderStatusLabels;
  paymentStatusLabels: Record<string, string>;
  fieldStatus: string;
  fieldPaymentStatus: string;
  fieldStaff: string;
  fieldDuration: string;
  fieldAppointmentDate: string;
  fieldSchedule: string;
  fieldTotal: string;
  fieldTotalSuffix: string;        // "IVA incluido"
  fieldCreatedAt: string;
  fieldTags: string;
  fieldClient: string;
  noStaff: string;
  noPhone: string;
  noEmail: string;
  manageTags: string;
  noTags: string;
  cancelOrderButton: string;
  cancelOrderTitle: string;
  cancelOrderWarning: string;
  cancelOrderConfirm: string;
  cancelOrderCancel: string;
  cancelOrderSuccess: string;
  cancelOrderError: string;
  statusUpdateSuccess: string;
  statusUpdateError: string;
  tagsUpdateSuccess: string;
  tagsUpdateError: string;
};

export type SectionHints = {
  expandLabel: string;
  collapseLabel: string;
  editLabel: string;
  saveLabel: string;
  cancelLabel: string;
  saveSuccess: string;
  saveError: string;
  unsavedPrompt: string;
};

export type ServiceTabHints = {
  section: SectionHints;
  // Section titles
  languageTitle: string;
  addressTitle: string;
  serviceAnswersTitle: string;
  recurrenceTitle: string;
  notesTitle: string;
  // Field labels
  preferredLanguageLabel: string;
  addressLabel: string;
  countryLabel: string;
  cityLabel: string;
  postalCodeLabel: string;
  serviceNameLabel: string;
  scheduleTypeLabel: string;
  repeatEveryLabel: string;
  weekdaysLabel: string;
  startDateLabel: string;
  endDateLabel: string;
  timeWindowStartLabel: string;
  timeWindowEndLabel: string;
  hoursPerSessionLabel: string;
  recurrenceSummaryLabel: string;
  notesLabel: string;
  talentsNeededLabel: string;
  // Schedule type options
  scheduleTypeLabels: ScheduleTypeLabels;
  // Weekday short labels (Sun=0 … Sat=6)
  weekdayShort: string[];
  // Empty / placeholder
  empty: string;
  notProvided: string;
};

export type SpecialistsTabHints = {
  columnName: string;
  columnEmail: string;
  columnPhone: string;
  columnRating: string;
  columnCompleted: string;
  columnAction: string;
  selectButton: string;
  unselectButton: string;
  empty: string;
  noStaffAssigned: string;
  addTalentButton: string;
  // Modal
  modalTitle: string;
  modalSearchPlaceholder: string;
  modalEmpty: string;
  modalCancel: string;
  // Validation
  maxReachedToast: string;     // "Sólo se pueden seleccionar [count] talentos"
  selectSuccess: string;
  selectError: string;
  removeSuccess: string;
  removeError: string;
  reviewsCount: string;        // "([count] reviews)"
  qualifiedBadge: string;      // shown next to talents with talent_services for this order's service+country
};

export type HoursTabHints = {
  totalHoursLabel: string;
  totalHoursClientLabel: string;        // "Horas cliente: [count]"
  totalKilometersLabel: string;
  otherLabel: string;
  unitPriceLabel: string;
  reportedByLabel: string;
  reportedQtyLabel: string;             // "[name] Reportadas: [count]"
  confirmedQtyLabel: string;
  confirmedKmLabel: string;
  confirmedOtherLabel: string;
  pricePerKmLabel: string;
  pricePerOtherLabel: string;
  addOtherButton: string;
  removeOtherButton: string;
  saveLabel: string;
  saveSuccess: string;
  saveError: string;
};

export type BillingTabHints = {
  clientSectionTitle: string;
  talentSectionTitlePrefix: string;     // "A emitir para Talento {name}"
  totalPaidLabel: string;
  totalOwedLabel: string;
  columnService: string;
  columnUnitPrice: string;
  columnQty: string;
  columnDiscount: string;
  columnPrice: string;
  subtotalLabel: string;
  vatLabel: string;
  totalLabel: string;
  invoiceButton: string;
  invoiceSuccess: string;
  invoiceError: string;
  invoicedBadge: string;
  addLineButton: string;
  // Modal
  modalTitle: string;
  modalDescriptionLabel: string;
  modalDescriptionPlaceholder: string;
  modalUnitPriceLabel: string;
  modalQtyLabel: string;
  modalDiscountLabel: string;
  modalCancel: string;
  modalCreate: string;
  modalCreateError: string;
  empty: string;
  noTalentsAssigned: string;
  noTalentsAssignedHelp: string;
};

export type DocumentsTabHints = {
  columnDocument: string;
  columnUploadedAt: string;
  columnAction: string;
  download: string;
  empty: string;
  emptyHelp: string;
};

export type ActivityTabHints = {
  composerPlaceholder: string;
  addButton: string;
  systemAuthor: string;
  empty: string;
  errorSaving: string;
  relativeJustNow: string;
  relativeMinutes: string;        // uses [count]
  relativeHours: string;          // uses [count]
  relativeDays: string;           // uses [count]
};

// ── Tabs orchestrator ───────────────────────────────────────

export const DETAIL_TABS = ['service', 'specialists', 'hours', 'billing', 'documents', 'activity'] as const;
export type DetailTab = (typeof DETAIL_TABS)[number];

export type DetailTabsHints = {
  service: string;
  specialists: string;
  hours: string;
  billing: string;
  documents: string;
  activity: string;
};
