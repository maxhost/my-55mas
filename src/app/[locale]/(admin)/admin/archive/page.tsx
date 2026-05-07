import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { listOrders } from '@/features/orders/actions/list-orders';
import {
  getCountryOptions,
  getCityOptions,
  getTalentOptions,
  getClientOptions,
} from '@/features/orders/actions/get-filter-options';
import { ARCHIVE_STATUSES } from '@/features/orders';
import { OrdersList } from '@/features/orders/components/orders-list';
import { PageHeader } from '@/shared/components/page-header';

type Props = { params: { locale: string } };

export default async function AdminArchivePage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminArchive');

  const [orders, countries, cities, talents, clients] = await Promise.all([
    listOrders({ locale, statuses: [...ARCHIVE_STATUSES] }),
    getCountryOptions(locale),
    getCityOptions(locale),
    getTalentOptions(),
    getClientOptions(),
  ]);

  return (
    <div className="p-8">
      <PageHeader title={t('title')} />
      <OrdersList
        orders={orders}
        countryOptions={countries}
        cityOptions={cities}
        talentOptions={talents}
        clientOptions={clients}
        statusOptions={ARCHIVE_STATUSES}
        linkBasePath="/admin/archive/"
      />
    </div>
  );
}
