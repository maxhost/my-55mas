import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/shared/components/page-header';
import {
  getClientDetail,
  getClientDetailsData,
  getClientOrders,
  getClientPayments,
  getClientStats,
  ClientDetailTabs,
} from '@/features/clients/detail';
import type {
  DetailsTabHints,
  DetailTabsHints,
  HeaderHints,
  HighlightsHints,
  OrdersTabHints,
  PaymentsTabHints,
  StatusLabels,
} from '@/features/clients/detail';
import { CLIENT_STATUSES, type ClientStatus } from '@/features/clients';

type Props = { params: { locale: string; id: string } };

export default async function AdminClientDetailPage({ params: { locale, id } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminClientDetail');

  const client = await getClientDetail(id, locale);
  if (!client) notFound();

  const ordersFirstPage = { clientId: id, page: 0, pageSize: 50 };

  const [stats, payments, detailsRes, ordersPage] = await Promise.all([
    getClientStats(id),
    getClientPayments(id),
    getClientDetailsData(id, locale),
    getClientOrders(ordersFirstPage, locale),
  ]);

  if (!detailsRes) notFound();

  const statusLabels = buildStatusLabels(t);

  const hints = {
    header: {
      ...readHeader(t),
      statusLabels,
    } as HeaderHints,
    highlights: readHighlights(t) as HighlightsHints,
    tabs: readTabsHints(t) as DetailTabsHints,
    orders: readOrders(t) as OrdersTabHints,
    payments: readPayments(t) as PaymentsTabHints,
    details: readDetails(t) as DetailsTabHints,
  };

  return (
    <div className="p-8">
      <div className="mb-4">
        <Link
          href={`/${locale}/admin/clients`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToList')}
        </Link>
      </div>
      <PageHeader title={client.full_name ?? '—'} />
      <div className="mt-6">
        <ClientDetailTabs
          initialClient={client}
          initialStats={stats}
          initialOrders={ordersPage.rows}
          initialOrdersTotal={ordersPage.totalCount}
          initialPayments={payments}
          initialDetailsData={detailsRes.data}
          initialDetailsContext={detailsRes.context}
          locale={locale}
          hints={hints}
        />
      </div>
    </div>
  );
}

type T = Awaited<ReturnType<typeof getTranslations>>;

function buildStatusLabels(t: T): StatusLabels {
  const out = {} as StatusLabels;
  for (const status of CLIENT_STATUSES) {
    out[status as ClientStatus] = t(`header.statusLabels.${status}`);
  }
  return out;
}

function readHeader(t: T) {
  return {
    noPhone: t('header.noPhone'),
    noEmail: t('header.noEmail'),
    typeBusiness: t('header.typeBusiness'),
    typeIndividual: t('header.typeIndividual'),
    deleteButton: t('header.deleteButton'),
    deleteTitle: t('header.deleteTitle'),
    deleteWarning: t('header.deleteWarning'),
    deleteConfirmInputLabel: t('header.deleteConfirmInputLabel'),
    deleteConfirmInputPlaceholder: t('header.deleteConfirmInputPlaceholder'),
    deleteConfirm: t('header.deleteConfirm'),
    deleteCancel: t('header.deleteCancel'),
    deleteSuccess: t('header.deleteSuccess'),
    deleteError: t('header.deleteError'),
  };
}

function readHighlights(t: T) {
  return {
    ordersLabel: t('highlights.ordersLabel'),
    totalPaidLabel: t('highlights.totalPaidLabel'),
    balanceOwedLabel: t('highlights.balanceOwedLabel'),
    pendingOrdersSuffix: t('highlights.pendingOrdersSuffix'),
    none: t('highlights.none'),
  };
}

function readTabsHints(t: T) {
  return {
    orders: t('tabs.orders'),
    payments: t('tabs.payments'),
    details: t('tabs.details'),
  };
}

function readOrders(t: T) {
  return {
    columnNumber: t('orders.columnNumber'),
    columnDate: t('orders.columnDate'),
    columnService: t('orders.columnService'),
    columnTalent: t('orders.columnTalent'),
    columnStatus: t('orders.columnStatus'),
    columnPayment: t('orders.columnPayment'),
    columnTotal: t('orders.columnTotal'),
    filterStatus: t('orders.filterStatus'),
    filterPeriod: t('orders.filterPeriod'),
    searchPlaceholder: t('orders.searchPlaceholder'),
    empty: t('orders.empty'),
    loadMore: t('orders.loadMore'),
    loadingError: t('orders.loadingError'),
    pageInfo: t('orders.pageInfo'),
  };
}

function readPayments(t: T) {
  return {
    acumuladoLabel: t('payments.acumuladoLabel'),
    pendienteLabel: t('payments.pendienteLabel'),
    columnMonth: t('payments.columnMonth'),
    columnOrders: t('payments.columnOrders'),
    columnTotal: t('payments.columnTotal'),
    columnStatus: t('payments.columnStatus'),
    columnAction: t('payments.columnAction'),
    rowViewDetail: t('payments.rowViewDetail'),
    empty: t('payments.empty'),
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
    billingTitle: t('details.billingTitle'),
    fullNameLabel: t('details.fullNameLabel'),
    isBusinessLabel: t('details.isBusinessLabel'),
    companyNameLabel: t('details.companyNameLabel'),
    phoneLabel: t('details.phoneLabel'),
    emailLabel: t('details.emailLabel'),
    addressLabel: t('details.addressLabel'),
    countryLabel: t('details.countryLabel'),
    cityLabel: t('details.cityLabel'),
    fiscalIdTypeLabel: t('details.fiscalIdTypeLabel'),
    fiscalIdLabel: t('details.fiscalIdLabel'),
    billingAddressLabel: t('details.billingAddressLabel'),
    billingStateLabel: t('details.billingStateLabel'),
    billingPostalCodeLabel: t('details.billingPostalCodeLabel'),
    empty: t('details.empty'),
    notProvided: t('details.notProvided'),
    typeBusiness: t('details.typeBusiness'),
    typeIndividual: t('details.typeIndividual'),
  };
}
