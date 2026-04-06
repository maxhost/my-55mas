import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { listClients } from '@/features/clients/actions/list-clients';
import { getCountryOptions, getCityOptions } from '@/features/clients/actions/get-filter-options';
import { PageHeader } from '@/shared/components/page-header';
import { ClientsList } from '@/features/clients/components/clients-list';

type Props = { params: { locale: string } };

export default async function ClientsPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminClients');

  const [clients, countries, cities] = await Promise.all([
    listClients({ locale }),
    getCountryOptions(locale),
    getCityOptions(locale),
  ]);

  return (
    <div className="p-8">
      <PageHeader title={t('title')} />
      <ClientsList
        clients={clients}
        countryOptions={countries}
        cityOptions={cities}
      />
    </div>
  );
}
