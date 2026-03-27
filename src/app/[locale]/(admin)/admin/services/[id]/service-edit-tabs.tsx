'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceFormBuilder } from '@/features/forms/components/service-form-builder';
import type { FormWithTranslations, FormVariantSummary, FormCityOption } from '@/shared/lib/forms/types';
import { ServiceForm } from '@/features/services/components/service-form';
import { ServiceConfig } from '@/features/services/components/service-config';
import { SubtypesEditor } from '@/features/subtypes/components/subtypes-editor';
import type { SubtypeGroupWithTranslations } from '@/features/subtypes/types';
import type {
  ServiceDetail,
  CountryOption,
  CityOption,
  ServiceCountryDetail,
  ServiceCityDetail,
} from '@/features/services/types';

type Props = {
  service: ServiceDetail;
  countries: CountryOption[];
  allCities: CityOption[];
  form: FormWithTranslations | null;
  formVariants: FormVariantSummary[];
  subtypes: SubtypeGroupWithTranslations[];
};

export function ServiceEditTabs({
  service,
  countries,
  allCities,
  form,
  formVariants,
  subtypes,
}: Props) {
  const t = useTranslations('AdminServices');
  const locale = useLocale();

  // Derive subtypeGroups for form builder dropdown
  const subtypeGroups = useMemo(
    () => subtypes.map((g) => ({ slug: g.slug, name: g.translations[locale] ?? g.slug })),
    [subtypes, locale]
  );

  // Lift configured countries + cities state so Config and Form tabs stay in sync
  const [configuredCountries, setConfiguredCountries] = useState<ServiceCountryDetail[]>(
    service.countries
  );
  const [configuredCities, setConfiguredCities] = useState<ServiceCityDetail[]>(
    service.cities
  );

  // Map configured data → form-local types (boundary between features)
  const formCountries = configuredCountries.map((c) => ({
    id: c.country_id,
    name: c.country_name,
  }));

  const formCities: FormCityOption[] = configuredCities.map((c) => ({
    id: c.city_id,
    name: c.city_name,
    country_id: c.country_id,
  }));

  return (
    <Tabs defaultValue="content">
      <TabsList>
        <TabsTrigger value="content">{t('tabContent')}</TabsTrigger>
        <TabsTrigger value="config">{t('tabConfig')}</TabsTrigger>
        <TabsTrigger value="form">{t('tabForm')}</TabsTrigger>
        <TabsTrigger value="subtypes">{t('tabSubtypes')}</TabsTrigger>
      </TabsList>

      <TabsContent value="content" className="pt-6">
        <ServiceForm
          serviceId={service.id}
          translations={service.translations}
        />
      </TabsContent>

      <TabsContent value="config" className="pt-6">
        <ServiceConfig
          service={service}
          countries={countries}
          allCities={allCities}
          onCountriesChange={setConfiguredCountries}
          onCitiesChange={setConfiguredCities}
        />
      </TabsContent>

      <TabsContent value="form" className="pt-6">
        <ServiceFormBuilder
          serviceId={service.id}
          form={form}
          formVariants={formVariants}
          serviceCountries={formCountries}
          serviceCities={formCities}
          subtypeGroups={subtypeGroups}
        />
      </TabsContent>

      <TabsContent value="subtypes" className="pt-6">
        <SubtypesEditor
          serviceId={service.id}
          initialSubtypes={subtypes}
        />
      </TabsContent>
    </Tabs>
  );
}
