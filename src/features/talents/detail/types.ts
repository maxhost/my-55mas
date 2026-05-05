import type { AddressValue } from '@/shared/components/address-autocomplete';
import type { Question } from '@/shared/lib/questions/types';
import type { AvailableService } from '@/shared/lib/services/types';
import type { TalentStatus } from '../types';

// ── Status helpers ──────────────────────────────────────────

export const TALENT_PAYMENT_STATUSES = ['pending', 'approved', 'paid', 'cancelled'] as const;
export type TalentPaymentStatus = (typeof TALENT_PAYMENT_STATUSES)[number];

export const TALENT_PAYMENT_METHODS = ['transfer', 'account_balance', 'cash', 'other'] as const;
export type TalentPaymentMethod = (typeof TALENT_PAYMENT_METHODS)[number];

// ── Header / page meta ──────────────────────────────────────

export type TalentTagOption = {
  id: string;
  name: string;
};

export type TalentDetail = {
  /** talent_profiles.id */
  id: string;
  /** auth/user id (== profiles.id) */
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  status: TalentStatus;
  country_id: string | null;
  country_name: string | null;
  city_id: string | null;
  city_name: string | null;
  photo_url: string | null;
  onboarding_completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  internal_notes: string | null;
  preferred_payment: string | null;
  /** Tags currently assigned to this talent. */
  tags: TalentTagOption[];
};

export type TalentHighlightsStats = {
  totalOrders: number;
  ratingAvg: number | null;
  ratingCount: number;
  ageMonths: number;
  lastActivityDays: number | null;
};

// ── Tab Pedidos ─────────────────────────────────────────────

export type TalentOrderRow = {
  id: string;
  order_number: number;
  appointment_date: string | null;
  service_name: string | null;
  client_name: string | null;
  status: string;
  payment_status: string | null;
  talent_amount: number | null;
  currency: string | null;
};

export type TalentOrdersFilters = {
  status?: string | null;
  serviceId?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  search?: string | null;
};

export type TalentOrdersPage = {
  rows: TalentOrderRow[];
  totalCount: number;
};

// ── Tab Pagos ───────────────────────────────────────────────

export type TalentPayment = {
  id: string;
  period_month: string; // ISO date (first day of month)
  status: TalentPaymentStatus;
  total_amount: number;
  total_hours: number | null;
  currency: string;
  payment_method: string | null;
  payment_proof_url: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
};

export type TalentPaymentItem = {
  id: string;
  order_id: string;
  order_number: number;
  appointment_date: string | null;
  service_name: string | null;
  hours: number | null;
  unit_amount: number | null;
  total: number;
  notes: string | null;
};

export type TalentPaymentDetail = TalentPayment & {
  items: TalentPaymentItem[];
  /** Pre-signed URL to download the proof (null if no proof). */
  proof_signed_url: string | null;
};

export type TalentPaymentsStats = {
  acumulado: number;
  pendiente: number;
  pendingOrders: number;
  currency: string;
};

// ── Tab Documentos ──────────────────────────────────────────

export type TalentDocumentEntry = {
  service_id: string;
  service_name: string | null;
  question_key: string;
  question_label: string;
  url: string;
  /** When the talent_services row was last updated (proxy for upload date). */
  uploaded_at: string | null;
};

// ── Tab Detalles ────────────────────────────────────────────

export type PersonalDataValues = {
  full_name: string | null;
  gender: string | null;
  birth_date: string | null;
};

export type ContactValues = {
  email: string | null;
  phone: string | null;
  preferred_contact: string | null;
  address: AddressValue | null;
  preferred_country: string | null;
  preferred_city: string | null;
};

export type ProfessionalSituationValues = {
  professional_status: string | null;
  previous_experience: string | null;
};

export type TalentServiceRow = {
  service_id: string;
  service_name: string | null;
  country_id: string;
  country_name: string | null;
  unit_price: number;
  /** form_data jsonb — answers to talent_questions, key by question.key. */
  answers: Record<string, unknown>;
};

export type PaymentPrefsValues = {
  preferred_payment: string | null;
  has_social_security: boolean | null;
  fiscal_id_type_id: string | null;
  fiscal_id: string | null;
};

export type LanguagesValues = {
  language_codes: string[];
};

export type SurveyValues = Record<string, unknown>;

export type TalentDetailsData = {
  personal: PersonalDataValues;
  contact: ContactValues;
  professional: ProfessionalSituationValues;
  services: TalentServiceRow[];
  paymentPrefs: PaymentPrefsValues;
  languages: LanguagesValues;
  survey: SurveyValues;
};

export type SpokenLanguageOption = {
  code: string;
  name: string;
};

export type CountryRef = { id: string; code: string; name: string };
export type CityRef = { id: string; country_id: string; name: string };
export type FiscalIdTypeRef = { id: string; code: string; label: string };

export type TalentDetailContext = {
  countries: CountryRef[];
  /** Cities for the talent's current country (for selectors). */
  cities: CityRef[];
  /** Available services scoped to the talent's country/city. */
  availableServices: AvailableService[];
  spokenLanguages: SpokenLanguageOption[];
  surveyQuestions: Question[];
  fiscalIdTypes: FiscalIdTypeRef[];
};

// ── Tab Notas ───────────────────────────────────────────────

export type TalentNote = {
  id: string;
  body: string;
  is_system: boolean;
  pinned: boolean;
  author_id: string | null;
  author_name: string | null;
  created_at: string;
};

// ── Tab Reviews ─────────────────────────────────────────────

export type TalentReviewByService = {
  service_id: string;
  service_name: string | null;
  ratingAvg: number;
  ratingCount: number;
  completedOrdersCount: number;
};

// ── Hints (i18n strings injected into client components) ────

export type StatusLabels = Record<TalentStatus, string>;

export type HeaderHints = {
  statusLabels: StatusLabels;
  updateStatusButton: string;
  noPhone: string;
  noEmail: string;
  manageTags: string;
  noTags: string;
  noOnboarding: string;
  // Update Status Modal:
  updateStatusTitle: string;
  updateStatusSelectLabel: string;
  updateStatusReasonLabel: string;
  updateStatusReasonPlaceholder: string;
  updateStatusConfirm: string;
  updateStatusCancel: string;
  updateStatusSuccess: string;
  updateStatusError: string;
  systemNoteStatusChange: string; // template: "Status cambiado: {old} → {new}. Razón: {reason}"
  systemNoteStatusChangeNoReason: string; // template: "Status cambiado: {old} → {new}"
};

export type HighlightsHints = {
  ordersLabel: string;
  ratingLabel: string;
  ageLabel: string;
  lastActivityLabel: string;
  none: string;
  monthsShort: string; // "m"
  daysShort: string; // "d"
  reviewsCount: string; // "({count} reviews)"
};

export type OrdersTabHints = {
  columnNumber: string;
  columnDate: string;
  columnService: string;
  columnClient: string;
  columnStatus: string;
  columnPayment: string;
  columnTalentAmount: string;
  filterStatus: string;
  filterPeriod: string;
  filterService: string;
  searchPlaceholder: string;
  empty: string;
  loadMore: string;
  loadingError: string;
  pageInfo: string; // "Mostrando {from}-{to} de {total}"
};

export type PaymentsTabHints = {
  preferredPaymentLabel: string;
  acumuladoLabel: string;
  pendienteLabel: string;
  pendingOrdersSuffix: string; // "(N órdenes)"
  markAsPaidButton: string;
  columnMonth: string;
  columnOrders: string;
  columnGross: string;
  columnCommission: string;
  columnNet: string;
  columnStatus: string;
  columnAction: string;
  rowMarkPaid: string;
  rowViewDetail: string;
  empty: string;
  // Mark As Paid Sheet:
  sheetTitle: string;
  step1Title: string;
  step1MethodLabel: string;
  methodLabels: Record<TalentPaymentMethod, string>;
  step2Title: string;
  step2TransferLabel: string;
  step2TransferPlaceholder: string;
  step2BalanceInfo: string;
  step3Title: string;
  step3UploadLabel: string;
  cancelButton: string;
  submitButton: string;
  successMessage: string;
  errorMessage: string;
  statusLabels: Record<TalentPaymentStatus, string>;
  // Detail sheet:
  detailTitle: string;
  detailItemsLabel: string;
  detailDownloadProof: string;
  detailNoProof: string;
};

export type DocumentsTabHints = {
  columnDocument: string;
  columnService: string;
  columnUploadedAt: string;
  columnAction: string;
  download: string;
  empty: string;
  emptyHelp: string;
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

export type DetailsTabHints = {
  section: SectionHints;
  // Section titles:
  personalDataTitle: string;
  contactTitle: string;
  professionalSituationTitle: string;
  talentServicesTitle: string;
  paymentPrefsTitle: string;
  languagesTitle: string;
  otherSurveyTitle: string;
  // Field labels (re-used across sections):
  fullNameLabel: string;
  genderLabel: string;
  birthDateLabel: string;
  emailLabel: string;
  phoneLabel: string;
  preferredContactLabel: string;
  addressLabel: string;
  countryLabel: string;
  cityLabel: string;
  professionalStatusLabel: string;
  previousExperienceLabel: string;
  preferredPaymentLabel: string;
  hasSocialSecurityLabel: string;
  fiscalIdTypeLabel: string;
  fiscalIdLabel: string;
  unitPriceLabel: string;
  // Empty / placeholder:
  empty: string;
  notProvided: string;
  // Talent services edit sheet:
  servicesEditButton: string;
  servicesEditTitle: string;
  servicesAddButton: string;
  servicesRemoveButton: string;
  // Languages chips:
  languageRemove: string;
  languageAddButton: string;
};

export type NotesTabHints = {
  composerPlaceholder: string;
  addButton: string;
  systemAuthor: string;
  pinnedLabel: string;
  pinAction: string;
  unpinAction: string;
  empty: string;
  errorLoading: string;
  errorSaving: string;
  relativeJustNow: string;
  relativeMinutes: string;
  relativeHours: string;
  relativeDays: string;
};

export type ReviewsTabHints = {
  columnService: string;
  columnRating: string;
  columnCompletedOrders: string;
  empty: string;
  reviewsCount: string;
};

// ── Tabs orchestrator ───────────────────────────────────────

export const DETAIL_TABS = ['orders', 'payments', 'documents', 'details', 'notes', 'reviews'] as const;
export type DetailTab = (typeof DETAIL_TABS)[number];

export type DetailTabsHints = {
  orders: string;
  payments: string;
  documents: string;
  details: string;
  notes: string;
  reviews: string;
};
