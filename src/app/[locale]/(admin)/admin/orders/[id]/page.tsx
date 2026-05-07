import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/shared/components/page-header';
import {
  getOrderActivity,
  getOrderBilling,
  getOrderDetail,
  getOrderDocuments,
  getOrderHours,
  getOrderServiceData,
  getOrderTagOptions,
  getOrderTalents,
  getTalentSearchContext,
  OrderDetailTabs,
} from '@/features/orders/detail';
import type {
  ActivityTabHints,
  BillingTabHints,
  DetailTabsHints,
  DocumentsTabHints,
  HeaderHints,
  HoursTabHints,
  ServiceTabHints,
  SpecialistsTabHints,
} from '@/features/orders/detail';
import { ORDER_STATUSES, ORDER_SCHEDULE_TYPES, type OrderStatus, type OrderScheduleType } from '@/features/orders';

type Props = { params: { locale: string; id: string } };

const PAYMENT_STATUSES = [
  'sin_pago',
  'pending',
  'pendiente_de_pago',
  'paid',
  'cancelled',
  'overdue',
] as const;

export default async function AdminOrderDetailPage({ params: { locale, id } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminOrderDetail');

  const order = await getOrderDetail(id, locale);
  if (!order) notFound();

  const [
    serviceRes,
    assigned,
    talentSearchContext,
    hoursData,
    billingData,
    documents,
    activity,
    availableTags,
  ] = await Promise.all([
    getOrderServiceData(id, locale),
    getOrderTalents(id),
    getTalentSearchContext(id, locale),
    getOrderHours(id),
    getOrderBilling(id),
    getOrderDocuments(id, locale),
    getOrderActivity(id),
    getOrderTagOptions(locale),
  ]);

  if (!serviceRes) notFound();

  const hints = {
    header: readHeader(t) as HeaderHints,
    tabs: readTabsHints(t) as DetailTabsHints,
    service: readService(t) as ServiceTabHints,
    specialists: readSpecialists(t) as SpecialistsTabHints,
    hours: readHours(t) as HoursTabHints,
    billing: readBilling(t) as BillingTabHints,
    documents: readDocuments(t) as DocumentsTabHints,
    activity: readActivity(t) as ActivityTabHints,
  };

  return (
    <div className="p-8">
      <div className="mb-4">
        <Link
          href={`/${locale}/admin/orders`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToList')}
        </Link>
      </div>
      <PageHeader title={`#${order.order_number}`} />
      <div className="mt-6">
        <OrderDetailTabs
          initialOrder={order}
          availableTags={availableTags}
          initialServiceData={serviceRes.data}
          initialServiceContext={serviceRes.context}
          initialAssigned={assigned}
          initialTalentSearchContext={talentSearchContext}
          initialHours={hoursData}
          initialBilling={billingData}
          initialDocuments={documents}
          initialActivity={activity}
          locale={locale}
          hints={hints}
        />
      </div>
    </div>
  );
}

type T = Awaited<ReturnType<typeof getTranslations>>;

function readHeader(t: T) {
  const statusLabels: Record<OrderStatus, string> = {} as Record<OrderStatus, string>;
  for (const s of ORDER_STATUSES) statusLabels[s] = t(`header.statusLabels.${s}`);
  const paymentStatusLabels: Record<string, string> = {};
  for (const s of PAYMENT_STATUSES) paymentStatusLabels[s] = t(`header.paymentStatusLabels.${s}`);
  return {
    statusLabels,
    paymentStatusLabels,
    fieldStatus: t('header.fieldStatus'),
    fieldPaymentStatus: t('header.fieldPaymentStatus'),
    fieldStaff: t('header.fieldStaff'),
    fieldDuration: t('header.fieldDuration'),
    fieldAppointmentDate: t('header.fieldAppointmentDate'),
    fieldSchedule: t('header.fieldSchedule'),
    fieldTotal: t('header.fieldTotal'),
    fieldTotalSuffix: t('header.fieldTotalSuffix'),
    fieldCreatedAt: t('header.fieldCreatedAt'),
    fieldTags: t('header.fieldTags'),
    fieldClient: t('header.fieldClient'),
    noStaff: t('header.noStaff'),
    noPhone: t('header.noPhone'),
    noEmail: t('header.noEmail'),
    manageTags: t('header.manageTags'),
    noTags: t('header.noTags'),
    cancelOrderButton: t('header.cancelOrderButton'),
    cancelOrderTitle: t('header.cancelOrderTitle'),
    cancelOrderWarning: t('header.cancelOrderWarning'),
    cancelOrderConfirm: t('header.cancelOrderConfirm'),
    cancelOrderCancel: t('header.cancelOrderCancel'),
    cancelOrderSuccess: t('header.cancelOrderSuccess'),
    cancelOrderError: t('header.cancelOrderError'),
    statusUpdateSuccess: t('header.statusUpdateSuccess'),
    statusUpdateError: t('header.statusUpdateError'),
    tagsUpdateSuccess: t('header.tagsUpdateSuccess'),
    tagsUpdateError: t('header.tagsUpdateError'),
  };
}

function readTabsHints(t: T) {
  return {
    service: t('tabs.service'),
    specialists: t('tabs.specialists'),
    hours: t('tabs.hours'),
    billing: t('tabs.billing'),
    documents: t('tabs.documents'),
    activity: t('tabs.activity'),
  };
}

function readService(t: T) {
  const scheduleTypeLabels: Record<OrderScheduleType, string> = {} as Record<OrderScheduleType, string>;
  for (const s of ORDER_SCHEDULE_TYPES) scheduleTypeLabels[s] = t(`service.scheduleTypeLabels.${s}`);
  const weekdayShort: string[] = [];
  for (let i = 0; i < 7; i++) weekdayShort.push(t(`service.weekdayShort.${i}`));
  return {
    section: {
      expandLabel: t('service.section.expandLabel'),
      collapseLabel: t('service.section.collapseLabel'),
      editLabel: t('service.section.editLabel'),
      saveLabel: t('service.section.saveLabel'),
      cancelLabel: t('service.section.cancelLabel'),
      saveSuccess: t('service.section.saveSuccess'),
      saveError: t('service.section.saveError'),
      unsavedPrompt: t('service.section.unsavedPrompt'),
    },
    languageTitle: t('service.languageTitle'),
    addressTitle: t('service.addressTitle'),
    serviceAnswersTitle: t('service.serviceAnswersTitle'),
    recurrenceTitle: t('service.recurrenceTitle'),
    notesTitle: t('service.notesTitle'),
    preferredLanguageLabel: t('service.preferredLanguageLabel'),
    addressLabel: t('service.addressLabel'),
    countryLabel: t('service.countryLabel'),
    cityLabel: t('service.cityLabel'),
    postalCodeLabel: t('service.postalCodeLabel'),
    serviceNameLabel: t('service.serviceNameLabel'),
    scheduleTypeLabel: t('service.scheduleTypeLabel'),
    repeatEveryLabel: t('service.repeatEveryLabel'),
    weekdaysLabel: t('service.weekdaysLabel'),
    startDateLabel: t('service.startDateLabel'),
    endDateLabel: t('service.endDateLabel'),
    timeWindowStartLabel: t('service.timeWindowStartLabel'),
    timeWindowEndLabel: t('service.timeWindowEndLabel'),
    hoursPerSessionLabel: t('service.hoursPerSessionLabel'),
    recurrenceSummaryLabel: t('service.recurrenceSummaryLabel'),
    notesLabel: t('service.notesLabel'),
    talentsNeededLabel: t('service.talentsNeededLabel'),
    scheduleTypeLabels,
    weekdayShort,
    empty: t('service.empty'),
    notProvided: t('service.notProvided'),
  };
}

function readSpecialists(t: T) {
  return {
    columnName: t('specialists.columnName'),
    columnEmail: t('specialists.columnEmail'),
    columnPhone: t('specialists.columnPhone'),
    columnRating: t('specialists.columnRating'),
    columnCompleted: t('specialists.columnCompleted'),
    columnAction: t('specialists.columnAction'),
    selectButton: t('specialists.selectButton'),
    unselectButton: t('specialists.unselectButton'),
    empty: t('specialists.empty'),
    noStaffAssigned: t('specialists.noStaffAssigned'),
    addTalentButton: t('specialists.addTalentButton'),
    modalTitle: t('specialists.modalTitle'),
    modalSearchPlaceholder: t('specialists.modalSearchPlaceholder'),
    modalEmpty: t('specialists.modalEmpty'),
    modalCancel: t('specialists.modalCancel'),
    maxReachedToast: t('specialists.maxReachedToast'),
    selectSuccess: t('specialists.selectSuccess'),
    selectError: t('specialists.selectError'),
    removeSuccess: t('specialists.removeSuccess'),
    removeError: t('specialists.removeError'),
    reviewsCount: t('specialists.reviewsCount'),
    qualifiedBadge: t('specialists.qualifiedBadge'),
    loading: t('specialists.loading'),
    filters: {
      searchPlaceholder: t('specialists.filters.searchPlaceholder'),
      filtersLabel: t('specialists.filters.filtersLabel'),
      filterCountry: t('specialists.filters.filterCountry'),
      filterCity: t('specialists.filters.filterCity'),
      filterPostalCode: t('specialists.filters.filterPostalCode'),
      filterService: t('specialists.filters.filterService'),
      postalCodePlaceholder: t('specialists.filters.postalCodePlaceholder'),
      clearFilters: t('specialists.filters.clearFilters'),
      notProvided: t('specialists.filters.notProvided'),
    },
    row: {
      selectButton: t('specialists.row.selectButton'),
      qualifiedBadge: t('specialists.row.qualifiedBadge'),
      reviewsCount: t('specialists.row.reviewsCount'),
      servicesCount: t('specialists.row.servicesCount'),
      expandLabel: t('specialists.row.expandLabel'),
      collapseLabel: t('specialists.row.collapseLabel'),
      detailCountryLabel: t('specialists.row.detailCountryLabel'),
      detailCityLabel: t('specialists.row.detailCityLabel'),
      detailPostalCodeLabel: t('specialists.row.detailPostalCodeLabel'),
      detailRegisteredServicesLabel: t('specialists.row.detailRegisteredServicesLabel'),
      notProvided: t('specialists.row.notProvided'),
    },
  };
}

function readHours(t: T) {
  return {
    totalHoursLabel: t('hours.totalHoursLabel'),
    totalHoursClientLabel: t('hours.totalHoursClientLabel'),
    totalKilometersLabel: t('hours.totalKilometersLabel'),
    otherLabel: t('hours.otherLabel'),
    unitPriceLabel: t('hours.unitPriceLabel'),
    reportedByLabel: t('hours.reportedByLabel'),
    reportedQtyLabel: t('hours.reportedQtyLabel'),
    confirmedQtyLabel: t('hours.confirmedQtyLabel'),
    confirmedKmLabel: t('hours.confirmedKmLabel'),
    confirmedOtherLabel: t('hours.confirmedOtherLabel'),
    pricePerKmLabel: t('hours.pricePerKmLabel'),
    pricePerOtherLabel: t('hours.pricePerOtherLabel'),
    addOtherButton: t('hours.addOtherButton'),
    removeOtherButton: t('hours.removeOtherButton'),
    saveLabel: t('hours.saveLabel'),
    saveSuccess: t('hours.saveSuccess'),
    saveError: t('hours.saveError'),
  };
}

function readBilling(t: T) {
  return {
    clientSectionTitle: t('billing.clientSectionTitle'),
    talentSectionTitlePrefix: t('billing.talentSectionTitlePrefix'),
    totalPaidLabel: t('billing.totalPaidLabel'),
    totalOwedLabel: t('billing.totalOwedLabel'),
    columnService: t('billing.columnService'),
    columnUnitPrice: t('billing.columnUnitPrice'),
    columnQty: t('billing.columnQty'),
    columnDiscount: t('billing.columnDiscount'),
    columnPrice: t('billing.columnPrice'),
    subtotalLabel: t('billing.subtotalLabel'),
    vatLabel: t('billing.vatLabel'),
    totalLabel: t('billing.totalLabel'),
    invoiceButton: t('billing.invoiceButton'),
    invoiceSuccess: t('billing.invoiceSuccess'),
    invoiceError: t('billing.invoiceError'),
    invoicedBadge: t('billing.invoicedBadge'),
    addLineButton: t('billing.addLineButton'),
    modalTitle: t('billing.modalTitle'),
    modalDescriptionLabel: t('billing.modalDescriptionLabel'),
    modalDescriptionPlaceholder: t('billing.modalDescriptionPlaceholder'),
    modalUnitPriceLabel: t('billing.modalUnitPriceLabel'),
    modalQtyLabel: t('billing.modalQtyLabel'),
    modalDiscountLabel: t('billing.modalDiscountLabel'),
    modalCancel: t('billing.modalCancel'),
    modalCreate: t('billing.modalCreate'),
    modalCreateError: t('billing.modalCreateError'),
    empty: t('billing.empty'),
    noTalentsAssigned: t('billing.noTalentsAssigned'),
    noTalentsAssignedHelp: t('billing.noTalentsAssignedHelp'),
  };
}

function readDocuments(t: T) {
  return {
    columnDocument: t('documents.columnDocument'),
    columnUploadedAt: t('documents.columnUploadedAt'),
    columnAction: t('documents.columnAction'),
    download: t('documents.download'),
    empty: t('documents.empty'),
    emptyHelp: t('documents.emptyHelp'),
  };
}

function readActivity(t: T) {
  return {
    composerPlaceholder: t('activity.composerPlaceholder'),
    addButton: t('activity.addButton'),
    systemAuthor: t('activity.systemAuthor'),
    empty: t('activity.empty'),
    errorSaving: t('activity.errorSaving'),
    relativeJustNow: t('activity.relativeJustNow'),
    relativeMinutes: t('activity.relativeMinutes'),
    relativeHours: t('activity.relativeHours'),
    relativeDays: t('activity.relativeDays'),
  };
}
