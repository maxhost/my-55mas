import type { AddressValue } from '@/shared/components/address-autocomplete';
import type { ClientStatus } from '../types';

// ── Status helpers ──────────────────────────────────────────

export const CLIENT_PAYMENT_STATUSES = ['pending', 'approved', 'paid', 'cancelled'] as const;
export type ClientPaymentStatus = (typeof CLIENT_PAYMENT_STATUSES)[number];

// ── Header / page meta ──────────────────────────────────────

export type ClientDetail = {
  /** client_profiles.id */
  id: string;
  /** auth/user id (== profiles.id) */
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_business: boolean;
  company_name: string | null;
  status: ClientStatus;
  country_id: string | null;
  country_name: string | null;
  city_id: string | null;
  city_name: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ClientStats = {
  totalOrders: number;
  totalPaid: number;
  balanceOwed: number;
  pendingOrders: number;
  currency: string;
};

// ── Tab Pedidos ─────────────────────────────────────────────

export type ClientOrderRow = {
  id: string;
  order_number: number;
  appointment_date: string | null;
  service_name: string | null;
  talent_name: string | null;
  status: string;
  payment_status: string | null;
  price_total: number | null;
  currency: string | null;
};

export type ClientOrdersFilters = {
  status?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  search?: string | null;
};

export type ClientOrdersPage = {
  rows: ClientOrderRow[];
  totalCount: number;
};

// ── Tab Pagos ───────────────────────────────────────────────

export type ClientPayment = {
  id: string;
  period_month: string;
  status: ClientPaymentStatus;
  total_amount: number;
  currency: string;
  payment_method: string | null;
  payment_proof_url: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
};

export type ClientPaymentItem = {
  id: string;
  order_id: string;
  order_number: number;
  appointment_date: string | null;
  service_name: string | null;
  total: number;
  notes: string | null;
};

export type ClientPaymentDetail = ClientPayment & {
  items: ClientPaymentItem[];
  proof_signed_url: string | null;
};

// ── Tab Detalle ─────────────────────────────────────────────

export type PersonalDataValues = {
  full_name: string | null;
  is_business: boolean;
  company_name: string | null;
  phone: string | null;
};

export type ContactValues = {
  email: string | null;
  address: AddressValue | null;
  preferred_country: string | null;
  preferred_city: string | null;
};

export type BillingValues = {
  fiscal_id_type_id: string | null;
  company_tax_id: string | null;
  billing_address: string | null;
  billing_state: string | null;
  billing_postal_code: string | null;
};

export type ClientDetailsData = {
  personal: PersonalDataValues;
  contact: ContactValues;
  billing: BillingValues;
};

export type CountryRef = { id: string; code: string; name: string };
export type CityRef = { id: string; country_id: string; name: string };
export type FiscalIdTypeRef = { id: string; code: string; label: string };

export type ClientDetailContext = {
  countries: CountryRef[];
  cities: CityRef[];
  fiscalIdTypes: FiscalIdTypeRef[];
};

// ── Hints (i18n strings injected into client components) ────

export type StatusLabels = Record<ClientStatus, string>;

export type HeaderHints = {
  noPhone: string;
  noEmail: string;
  typeBusiness: string;
  typeIndividual: string;
  statusLabels: StatusLabels;
  // Delete modal:
  deleteButton: string;
  deleteTitle: string;
  deleteWarning: string;
  deleteConfirmInputLabel: string;
  deleteConfirmInputPlaceholder: string;
  deleteConfirm: string;
  deleteCancel: string;
  deleteSuccess: string;
  deleteError: string;
};

export type HighlightsHints = {
  ordersLabel: string;
  totalPaidLabel: string;
  balanceOwedLabel: string;
  pendingOrdersSuffix: string; // "({count} órdenes)"
  none: string;
};

export type OrdersTabHints = {
  columnNumber: string;
  columnDate: string;
  columnService: string;
  columnTalent: string;
  columnStatus: string;
  columnPayment: string;
  columnTotal: string;
  filterStatus: string;
  filterPeriod: string;
  searchPlaceholder: string;
  empty: string;
  loadMore: string;
  loadingError: string;
  pageInfo: string;
};

export type PaymentsTabHints = {
  acumuladoLabel: string;
  pendienteLabel: string;
  columnMonth: string;
  columnOrders: string;
  columnTotal: string;
  columnStatus: string;
  columnAction: string;
  rowViewDetail: string;
  empty: string;
  statusLabels: Record<ClientPaymentStatus, string>;
  detailTitle: string;
  detailItemsLabel: string;
  detailDownloadProof: string;
  detailNoProof: string;
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
  billingTitle: string;
  // Field labels:
  fullNameLabel: string;
  isBusinessLabel: string;
  companyNameLabel: string;
  phoneLabel: string;
  emailLabel: string;
  addressLabel: string;
  countryLabel: string;
  cityLabel: string;
  fiscalIdTypeLabel: string;
  fiscalIdLabel: string;
  billingAddressLabel: string;
  billingStateLabel: string;
  billingPostalCodeLabel: string;
  // Empty / placeholder:
  empty: string;
  notProvided: string;
  // Type values:
  typeBusiness: string;
  typeIndividual: string;
};

// ── Tabs orchestrator ───────────────────────────────────────

export const DETAIL_TABS = ['orders', 'payments', 'details'] as const;
export type DetailTab = (typeof DETAIL_TABS)[number];

export type DetailTabsHints = {
  orders: string;
  payments: string;
  details: string;
};
