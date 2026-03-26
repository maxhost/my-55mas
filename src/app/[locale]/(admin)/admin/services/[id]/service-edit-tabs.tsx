'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormBuilderPanel } from '@/features/forms/components/form-builder-panel';
import type { FormWithTranslations, FormVariantSummary, FormCityOption } from '@/features/forms/types';
import { ServiceForm } from '@/features/services/components/service-form';
import { ServiceConfig } from '@/features/services/components/service-config';
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
};

export function ServiceEditTabs({
  service,
  countries,
  allCities,
  form,
  formVariants,
}: Props) {
  const t = useTranslations('AdminServices');

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
        <FormBuilderPanel
          serviceId={service.id}
          form={form}
          formVariants={formVariants}
          serviceCountries={formCountries}
          serviceCities={formCities}
        />
      </TabsContent>
    </Tabs>
  );
}
