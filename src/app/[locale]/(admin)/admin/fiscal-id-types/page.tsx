import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { listFiscalIdTypes } from '@/features/fiscal-id-types/actions/list-fiscal-id-types';
import { listActiveCountries } from '@/features/fiscal-id-types/actions/list-active-countries';
import { FiscalIdTypesEditor } from '@/features/fiscal-id-types/components/fiscal-id-types-editor';
import { PageHeader } from '@/shared/components/page-header';

type Props = { params: { locale: string } };

export default async function FiscalIdTypesPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminFiscalIdTypes');

  const [types, countries] = await Promise.all([
    listFiscalIdTypes(),
    listActiveCountries(locale),
  ]);

  return (
    <div className="p-8">
      <PageHeader title={t('title')} />
      <FiscalIdTypesEditor initialTypes={types} countries={countries} />
    </div>
  );
}
