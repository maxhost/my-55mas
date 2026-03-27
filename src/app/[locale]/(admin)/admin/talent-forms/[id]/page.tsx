import { notFound } from 'next/navigation';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getTalentForm } from '@/features/talent-forms/actions/get-talent-form';
import { listTalentFormVariants } from '@/features/talent-forms/actions/list-talent-form-variants';
import { getCountries } from '@/features/services/actions/get-countries';
import { getCities } from '@/features/services/actions/get-cities';
import { listSubtypes } from '@/features/subtypes/actions/list-subtypes';
import { PageHeader } from '@/shared/components/page-header';
import { TalentFormEditor } from './talent-form-editor';

type Props = { params: { locale: string; id: string } };

export default async function EditTalentFormPage({ params: { locale, id } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminTalentForms');
  const supabase = createClient();

  // Phase 1: get service_id (required before everything else)
  const { data: formRow } = await supabase
    .from('talent_forms')
    .select('id, service_id, city_id')
    .eq('id', id)
    .single();

  if (!formRow) notFound();

  // Phase 2: ALL remaining queries in parallel (all depend only on service_id)
  const [
    { data: serviceTrans },
    form,
    formVariants,
    countries,
    allCities,
    { data: serviceCountries },
    { data: serviceCities },
    subtypeGroupsRaw,
  ] = await Promise.all([
    supabase
      .from('service_translations')
      .select('name')
      .eq('service_id', formRow.service_id)
      .eq('locale', locale)
      .single(),
    getTalentForm(formRow.service_id, formRow.city_id, false, false),
    listTalentFormVariants(formRow.service_id, false),
    getCountries(locale),
    getCities(locale),
    supabase
      .from('service_countries')
      .select('country_id')
      .eq('service_id', formRow.service_id),
    supabase
      .from('service_cities')
      .select('city_id, cities!inner(country_id)')
      .eq('service_id', formRow.service_id),
    listSubtypes(formRow.service_id),
  ]);

  const serviceName = serviceTrans?.name ?? formRow.service_id;

  const configuredCountryIds = new Set(
    (serviceCountries ?? []).map((sc) => sc.country_id)
  );
  const formCountries = countries
    .filter((c) => configuredCountryIds.has(c.id))
    .map((c) => ({ id: c.id, name: c.name }));

  const configuredCityIds = new Set(
    (serviceCities ?? []).map((sc) => sc.city_id)
  );
  const cityCountryMap = new Map(
    (serviceCities ?? []).map((sc) => {
      const city = sc.cities as unknown as { country_id: string };
      return [sc.city_id, city.country_id];
    })
  );
  const formCities = allCities
    .filter((c) => configuredCityIds.has(c.id))
    .map((c) => ({
      id: c.id,
      name: c.name,
      country_id: cityCountryMap.get(c.id) ?? '',
    }));

  return (
    <div className="p-8">
      <PageHeader
        title={`${t('editForm')}: ${serviceName}`}
        backHref="/admin/talent-forms"
      />
      <TalentFormEditor
        serviceId={formRow.service_id}
        form={form}
        formVariants={formVariants}
        serviceCountries={formCountries}
        serviceCities={formCities}
        subtypeGroups={subtypeGroupsRaw.map((g) => ({
          slug: g.slug,
          name: g.translations[locale] ?? g.slug,
        }))}
      />
    </div>
  );
}
