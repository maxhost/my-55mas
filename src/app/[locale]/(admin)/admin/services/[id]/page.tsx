import { notFound } from 'next/navigation';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { getService } from '@/features/services/actions/get-service';
import { getCountries } from '@/features/services/actions/get-countries';
import { getCities } from '@/features/services/actions/get-cities';
import { getForm } from '@/features/forms/actions/get-form';
import { listFormVariants } from '@/features/forms/actions/list-form-variants';
import { PageHeader } from '@/shared/components/page-header';
import { ServiceEditTabs } from './service-edit-tabs';

type Props = { params: { locale: string; id: string } };

export default async function EditServicePage({ params: { locale, id } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminServices');

  const [service, countries, allCities, form, formVariants] = await Promise.all([
    getService(id),
    getCountries(locale),
    getCities(locale),
    getForm(id),
    listFormVariants(id),
  ]);

  if (!service) notFound();

  const name =
    service.translations.find((tr) => tr.locale === locale)?.name ??
    service.translations[0]?.name ??
    service.slug;

  return (
    <div className="p-8">
      <PageHeader
        title={`${t('editService')}: ${name}`}
        backHref="/admin/services"
      />
      <ServiceEditTabs
        service={service}
        countries={countries}
        allCities={allCities}
        form={form}
        formVariants={formVariants}
      />
    </div>
  );
}
