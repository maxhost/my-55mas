import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/shared/components/page-header';
import { ArrowLeft } from 'lucide-react';
import {
  composeHighlightsStats,
  getPaymentDetail as _gpd, // re-export safety: keep tree-shake in mind
  getTalentDetail,
  getTalentDetailsData,
  getTalentDocuments,
  getTalentNotes,
  getTalentOrders,
  getTalentPayments,
  getTalentReviews,
  getTalentTagOptions,
  TalentDetailTabs,
} from '@/features/talents/detail';
import type {
  DetailsTabHints,
  DetailTabsHints,
  DocumentsTabHints,
  HeaderHints,
  HighlightsHints,
  NotesTabHints,
  OrdersTabHints,
  PaymentsTabHints,
  ReviewsTabHints,
  StatusLabels,
} from '@/features/talents/detail';
import { TALENT_STATUSES, type TalentStatus } from '@/features/talents';

void _gpd;

type Props = { params: { locale: string; id: string } };

export default async function AdminTalentDetailPage({ params: { locale, id } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminTalentDetail');
  const tStatus = await getTranslations('AdminTalents');

  const talent = await getTalentDetail(id, locale);
  if (!talent) notFound();

  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: currentProfile } = auth.user
    ? await supabase.from('profiles').select('full_name').eq('id', auth.user.id).maybeSingle()
    : { data: null };

  const ordersFirstPage = { talentId: id, page: 0, pageSize: 50 };

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
    getTalentOrders(ordersFirstPage, locale),
    fetchOrdersForStats(id),
  ]);

  if (!detailsRes) notFound();

  const stats = composeHighlightsStats({
    orders: talentOrdersForStats,
    talentCreatedAt: talent.created_at,
    talentUpdatedAt: talent.updated_at,
  });

  const statusLabels = buildStatusLabels(tStatus);

  const hints = {
    header: {
      ...readHeader(t),
      statusLabels,
    } as HeaderHints,
    highlights: readHighlights(t) as HighlightsHints,
    tabs: readTabsHints(t) as DetailTabsHints,
    orders: readOrders(t) as OrdersTabHints,
    payments: readPayments(t) as PaymentsTabHints,
    documents: readDocuments(t) as DocumentsTabHints,
    details: readDetails(t) as DetailsTabHints,
    notes: readNotes(t) as NotesTabHints,
    reviews: readReviews(t) as ReviewsTabHints,
  };

  return (
    <div className="p-8">
      <div className="mb-4">
        <Link
          href={`/${locale}/admin/talents`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToList')}
        </Link>
      </div>
      <PageHeader title={talent.full_name ?? '—'} />
      <div className="mt-6">
        <TalentDetailTabs
          initialTalent={talent}
          initialAvailableTags={availableTags}
          initialStats={stats}
          initialOrders={ordersPage.rows}
          initialOrdersTotal={ordersPage.totalCount}
          initialPayments={paymentsRes.payments}
          initialPaymentStats={paymentsRes.stats}
          initialDocuments={documents}
          initialDetailsData={detailsRes.data}
          initialDetailsContext={detailsRes.context}
          initialNotes={notes}
          initialReviews={reviews}
          currentUserName={currentProfile?.full_name ?? ''}
          locale={locale}
          hints={hints}
        />
      </div>
    </div>
  );
}

async function fetchOrdersForStats(talentId: string) {
  const supabase = createClient();
  const { data: tp } = await supabase
    .from('talent_profiles')
    .select('user_id')
    .eq('id', talentId)
    .maybeSingle();
  if (!tp) return [];
  const { data } = await supabase
    .from('orders')
    .select('rating, updated_at')
    .eq('talent_id', tp.user_id);
  return data ?? [];
}

type T = Awaited<ReturnType<typeof getTranslations>>;

function buildStatusLabels(t: T): StatusLabels {
  const out = {} as StatusLabels;
  for (const status of TALENT_STATUSES) {
    out[status as TalentStatus] = t(status);
  }
  return out;
}

function readHeader(t: T) {
  return {
    noPhone: t('header.noPhone'),
    noEmail: t('header.noEmail'),
    noOnboarding: t('header.noOnboarding'),
    manageTags: t('header.manageTags'),
    noTags: t('header.noTags'),
    updateStatusButton: t('header.updateStatusButton'),
    updateStatusTitle: t('header.updateStatusTitle'),
    updateStatusSelectLabel: t('header.updateStatusSelectLabel'),
    updateStatusReasonLabel: t('header.updateStatusReasonLabel'),
    updateStatusReasonPlaceholder: t('header.updateStatusReasonPlaceholder'),
    updateStatusConfirm: t('header.updateStatusConfirm'),
    updateStatusCancel: t('header.updateStatusCancel'),
    updateStatusSuccess: t('header.updateStatusSuccess'),
    updateStatusError: t('header.updateStatusError'),
    systemNoteStatusChange: t('header.systemNoteStatusChange'),
    systemNoteStatusChangeNoReason: t('header.systemNoteStatusChangeNoReason'),
  };
}

function readHighlights(t: T) {
  return {
    ordersLabel: t('highlights.ordersLabel'),
    ratingLabel: t('highlights.ratingLabel'),
    ageLabel: t('highlights.ageLabel'),
    lastActivityLabel: t('highlights.lastActivityLabel'),
    none: t('highlights.none'),
    monthsShort: t('highlights.monthsShort'),
    daysShort: t('highlights.daysShort'),
    reviewsCount: t('highlights.reviewsCount'),
  };
}

function readTabsHints(t: T) {
  return {
    orders: t('tabs.orders'),
    payments: t('tabs.payments'),
    documents: t('tabs.documents'),
    details: t('tabs.details'),
    notes: t('tabs.notes'),
    reviews: t('tabs.reviews'),
  };
}

function readOrders(t: T) {
  return {
    columnNumber: t('orders.columnNumber'),
    columnDate: t('orders.columnDate'),
    columnService: t('orders.columnService'),
    columnClient: t('orders.columnClient'),
    columnStatus: t('orders.columnStatus'),
    columnPayment: t('orders.columnPayment'),
    columnTalentAmount: t('orders.columnTalentAmount'),
    filterStatus: t('orders.filterStatus'),
    filterPeriod: t('orders.filterPeriod'),
    filterService: t('orders.filterService'),
    searchPlaceholder: t('orders.searchPlaceholder'),
    empty: t('orders.empty'),
    loadMore: t('orders.loadMore'),
    loadingError: t('orders.loadingError'),
    pageInfo: t('orders.pageInfo'),
  };
}

function readPayments(t: T) {
  return {
    preferredPaymentLabel: t('payments.preferredPaymentLabel'),
    acumuladoLabel: t('payments.acumuladoLabel'),
    pendienteLabel: t('payments.pendienteLabel'),
    pendingOrdersSuffix: t('payments.pendingOrdersSuffix'),
    markAsPaidButton: t('payments.markAsPaidButton'),
    columnMonth: t('payments.columnMonth'),
    columnOrders: t('payments.columnOrders'),
    columnGross: t('payments.columnGross'),
    columnCommission: t('payments.columnCommission'),
    columnNet: t('payments.columnNet'),
    columnStatus: t('payments.columnStatus'),
    columnAction: t('payments.columnAction'),
    rowMarkPaid: t('payments.rowMarkPaid'),
    rowViewDetail: t('payments.rowViewDetail'),
    empty: t('payments.empty'),
    sheetTitle: t('payments.sheetTitle'),
    step1Title: t('payments.step1Title'),
    step1MethodLabel: t('payments.step1MethodLabel'),
    methodLabels: {
      transfer: t('payments.methodLabels.transfer'),
      account_balance: t('payments.methodLabels.account_balance'),
      cash: t('payments.methodLabels.cash'),
      other: t('payments.methodLabels.other'),
    },
    step2Title: t('payments.step2Title'),
    step2TransferLabel: t('payments.step2TransferLabel'),
    step2TransferPlaceholder: t('payments.step2TransferPlaceholder'),
    step2BalanceInfo: t('payments.step2BalanceInfo'),
    step3Title: t('payments.step3Title'),
    step3UploadLabel: t('payments.step3UploadLabel'),
    cancelButton: t('payments.cancelButton'),
    submitButton: t('payments.submitButton'),
    successMessage: t('payments.successMessage'),
    errorMessage: t('payments.errorMessage'),
    statusLabels: {
      pending: t('payments.statusLabels.pending'),
      approved: t('payments.statusLabels.approved'),
      paid: t('payments.statusLabels.paid'),
      cancelled: t('payments.statusLabels.cancelled'),
    },
    detailTitle: t('payments.detailTitle'),
    detailItemsLabel: t('payments.detailItemsLabel'),
    detailDownloadProof: t('payments.detailDownloadProof'),
    detailNoProof: t('payments.detailNoProof'),
  };
}

function readDocuments(t: T) {
  return {
    columnDocument: t('documents.columnDocument'),
    columnService: t('documents.columnService'),
    columnUploadedAt: t('documents.columnUploadedAt'),
    columnAction: t('documents.columnAction'),
    download: t('documents.download'),
    empty: t('documents.empty'),
    emptyHelp: t('documents.emptyHelp'),
  };
}

function readDetails(t: T) {
  return {
    section: {
      expandLabel: t('details.section.expandLabel'),
      collapseLabel: t('details.section.collapseLabel'),
      editLabel: t('details.section.editLabel'),
      saveLabel: t('details.section.saveLabel'),
      cancelLabel: t('details.section.cancelLabel'),
      saveSuccess: t('details.section.saveSuccess'),
      saveError: t('details.section.saveError'),
      unsavedPrompt: t('details.section.unsavedPrompt'),
    },
    personalDataTitle: t('details.personalDataTitle'),
    contactTitle: t('details.contactTitle'),
    professionalSituationTitle: t('details.professionalSituationTitle'),
    talentServicesTitle: t('details.talentServicesTitle'),
    paymentPrefsTitle: t('details.paymentPrefsTitle'),
    languagesTitle: t('details.languagesTitle'),
    otherSurveyTitle: t('details.otherSurveyTitle'),
    fullNameLabel: t('details.fullNameLabel'),
    genderLabel: t('details.genderLabel'),
    birthDateLabel: t('details.birthDateLabel'),
    emailLabel: t('details.emailLabel'),
    phoneLabel: t('details.phoneLabel'),
    preferredContactLabel: t('details.preferredContactLabel'),
    addressLabel: t('details.addressLabel'),
    countryLabel: t('details.countryLabel'),
    cityLabel: t('details.cityLabel'),
    professionalStatusLabel: t('details.professionalStatusLabel'),
    previousExperienceLabel: t('details.previousExperienceLabel'),
    preferredPaymentLabel: t('details.preferredPaymentLabel'),
    hasSocialSecurityLabel: t('details.hasSocialSecurityLabel'),
    fiscalIdTypeLabel: t('details.fiscalIdTypeLabel'),
    fiscalIdLabel: t('details.fiscalIdLabel'),
    unitPriceLabel: t('details.unitPriceLabel'),
    empty: t('details.empty'),
    notProvided: t('details.notProvided'),
    servicesEditButton: t('details.servicesEditButton'),
    servicesEditTitle: t('details.servicesEditTitle'),
    servicesAddButton: t('details.servicesAddButton'),
    servicesRemoveButton: t('details.servicesRemoveButton'),
    languageRemove: t('details.languageRemove'),
    languageAddButton: t('details.languageAddButton'),
  };
}

function readNotes(t: T) {
  return {
    composerPlaceholder: t('notes.composerPlaceholder'),
    addButton: t('notes.addButton'),
    systemAuthor: t('notes.systemAuthor'),
    pinnedLabel: t('notes.pinnedLabel'),
    pinAction: t('notes.pinAction'),
    unpinAction: t('notes.unpinAction'),
    empty: t('notes.empty'),
    errorLoading: t('notes.errorLoading'),
    errorSaving: t('notes.errorSaving'),
    relativeJustNow: t('notes.relativeJustNow'),
    relativeMinutes: t('notes.relativeMinutes'),
    relativeHours: t('notes.relativeHours'),
    relativeDays: t('notes.relativeDays'),
  };
}

function readReviews(t: T) {
  return {
    columnService: t('reviews.columnService'),
    columnRating: t('reviews.columnRating'),
    columnCompletedOrders: t('reviews.columnCompletedOrders'),
    empty: t('reviews.empty'),
    reviewsCount: t('reviews.reviewsCount'),
  };
}
