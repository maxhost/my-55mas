import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { listTalents } from '@/features/talents/actions/list-talents';
import { getCountryOptions, getCityOptions } from '@/features/talents/actions/get-filter-options';
import { PageHeader } from '@/shared/components/page-header';
import { TalentsList } from '@/features/talents/components/talents-list';

type Props = { params: { locale: string } };

export default async function TalentsPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminTalents');

  const [talents, countries, cities] = await Promise.all([
    listTalents({ locale }),
    getCountryOptions(locale),
    getCityOptions(locale),
  ]);

  return (
    <div className="p-8">
      <PageHeader title={t('title')} />
      <TalentsList
        talents={talents}
        countryOptions={countries}
        cityOptions={cities}
      />
    </div>
  );
}
