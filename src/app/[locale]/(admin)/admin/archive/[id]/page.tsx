import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/shared/components/page-header';
import { OrderDetailTabs, loadOrderDetailPageData } from '@/features/orders/detail';
import { isArchiveStatus } from '@/features/orders';

type Props = { params: { locale: string; id: string } };

export default async function AdminArchiveDetailPage({ params: { locale, id } }: Props) {
  unstable_setRequestLocale(locale);
  const tDetail = await getTranslations('AdminOrderDetail');
  const tArchive = await getTranslations('AdminArchive');

  const data = await loadOrderDetailPageData(id, locale, tDetail);
  if (!data) notFound();
  if (!isArchiveStatus(data.order.status)) notFound();

  return (
    <div className="p-8">
      <div className="mb-4">
        <Link
          href={`/${locale}/admin/archive`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {tArchive('backToList')}
        </Link>
      </div>
      <PageHeader title={`#${data.order.order_number}`} />
      <div className="mt-6">
        <OrderDetailTabs
          initialOrder={data.order}
          availableTags={data.availableTags}
          initialServiceData={data.initialServiceData}
          initialServiceContext={data.initialServiceContext}
          initialAssigned={data.initialAssigned}
          initialTalentSearchContext={data.initialTalentSearchContext}
          initialHours={data.initialHours}
          initialBilling={data.initialBilling}
          initialDocuments={data.initialDocuments}
          initialActivity={data.initialActivity}
          locale={locale}
          hints={data.hints}
          readOnly
          onCancelledRedirect={`/${locale}/admin/archive`}
        />
      </div>
    </div>
  );
}
