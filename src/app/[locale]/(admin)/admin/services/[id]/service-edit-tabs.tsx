'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceForm } from '@/features/services/components/service-form';
import { ServiceConfig } from '@/features/services/components/service-config';
import { CoverImageUpload } from '@/features/services/components/cover-image-upload';
import { GroupAssignmentEditor } from '@/features/subtypes/components/group-assignment-editor';
import type { SubtypeGroupWithTranslations } from '@/features/subtypes/types';
import { QuestionsEditor } from '@/features/service-questions/components/questions-editor';
import type { Question } from '@/shared/lib/questions/types';
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

  const mappedAssignedGroups = assignedSubtypes.map((g) => ({
    id: g.id,
    slug: g.slug,
    translations: g.translations,
    items: g.items.map((it) => ({
      id: it.id,
      slug: it.slug,
      translations: it.translations,
    })),
  }));

  return (
    <Tabs defaultValue="content">
      <TabsList>
        <TabsTrigger value="content">{t('tabContent')}</TabsTrigger>
        <TabsTrigger value="config">{t('tabConfig')}</TabsTrigger>
        <TabsTrigger value="subtypes">{t('tabSubtypes')}</TabsTrigger>
        <TabsTrigger value="client-questions">{t('tabClientQuestions')}</TabsTrigger>
        <TabsTrigger value="talent-questions">{t('tabTalentQuestions')}</TabsTrigger>
      </TabsList>

      <TabsContent value="content" className="space-y-6 pt-6">
        <CoverImageUpload
          serviceId={service.id}
          initialCoverBase={service.cover_image_url}
        />
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

      <TabsContent value="client-questions" className="pt-6">
        <QuestionsEditor
          serviceId={service.id}
          target="client"
          initialQuestions={(service.questions as unknown as Question[]) ?? []}
          assignedGroups={mappedAssignedGroups}
        />
      </TabsContent>

      <TabsContent value="talent-questions" className="pt-6">
        <QuestionsEditor
          serviceId={service.id}
          target="talent"
          initialQuestions={(service.talent_questions as unknown as Question[]) ?? []}
          assignedGroups={mappedAssignedGroups}
        />
      </TabsContent>
    </Tabs>
  );
}
