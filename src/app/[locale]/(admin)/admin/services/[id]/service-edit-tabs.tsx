'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceForm } from '@/features/services/components/service-form';
import { ServiceConfig } from '@/features/services/components/service-config';
import { GroupAssignmentEditor } from '@/features/subtypes/components/group-assignment-editor';
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
  assignedSubtypes: SubtypeGroupWithTranslations[];
  allSubtypes: SubtypeGroupWithTranslations[];
};

export function ServiceEditTabs({
  service,
  countries,
  allCities,
  assignedSubtypes,
  allSubtypes,
}: Props) {
  const t = useTranslations('AdminServices');
  const locale = useLocale();

  const [, setConfiguredCountries] = useState<ServiceCountryDetail[]>(
    service.countries
  );
  const [, setConfiguredCities] = useState<ServiceCityDetail[]>(service.cities);

  const assignedGroupIds = assignedSubtypes.map((g) => g.id);

  return (
    <Tabs defaultValue="content">
      <TabsList>
        <TabsTrigger value="content">{t('tabContent')}</TabsTrigger>
        <TabsTrigger value="config">{t('tabConfig')}</TabsTrigger>
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

      <TabsContent value="subtypes" className="pt-6">
        <GroupAssignmentEditor
          serviceId={service.id}
          assignedGroupIds={assignedGroupIds}
          allGroups={allSubtypes}
          locale={locale}
        />
      </TabsContent>
    </Tabs>
  );
}
