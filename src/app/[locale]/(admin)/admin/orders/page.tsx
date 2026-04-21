import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { listOrders } from '@/features/orders/actions/list-orders';
import {
  getCountryOptions,
  getCityOptions,
  getTalentOptions,
  getClientOptions,
} from '@/features/orders/actions/get-filter-options';
import { PageHeader } from '@/shared/components/page-header';
import { OrdersList } from '@/features/orders/components/orders-list';

type Props = { params: { locale: string } };

export default async function OrdersPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminOrders');

  const [orders, countries, cities, talents, clients] = await Promise.all([
    listOrders({ locale }),
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
      />
    </div>
  );
}
