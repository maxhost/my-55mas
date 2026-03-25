'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormBuilderPanel } from '@/features/forms/components/form-builder-panel';
import type { FormWithTranslations, FormVariantSummary } from '@/features/forms/types';
import { ServiceForm } from '@/features/services/components/service-form';
import { ServiceConfig } from '@/features/services/components/service-config';
import type {
  ServiceDetail,
  CountryOption,
} from '@/features/services/types';

type Props = {
  service: ServiceDetail;
  countries: CountryOption[];
  form: FormWithTranslations | null;
  formVariants: FormVariantSummary[];
};

export function ServiceEditTabs({
  service,
  countries,
  form,
  formVariants,
}: Props) {
  const t = useTranslations('AdminServices');

  // Map CountryOption → FormCountryOption (boundary between features)
  const formCountries = countries.map((c) => ({ id: c.id, name: c.name }));

  return (
    <Tabs defaultValue="content">
      <TabsList>
        <TabsTrigger value="content">{t('tabContent')}</TabsTrigger>
        <TabsTrigger value="form">{t('tabForm')}</TabsTrigger>
        <TabsTrigger value="config">{t('tabConfig')}</TabsTrigger>
      </TabsList>

      <TabsContent value="content" className="pt-6">
        <ServiceForm
          serviceId={service.id}
          translations={service.translations}
        />
      </TabsContent>

      <TabsContent value="form" className="pt-6">
        <FormBuilderPanel
          serviceId={service.id}
          form={form}
          formVariants={formVariants}
          serviceCountries={formCountries}
        />
      </TabsContent>

      <TabsContent value="config" className="pt-6">
        <ServiceConfig
          service={service}
          countries={countries}
        />
      </TabsContent>
    </Tabs>
  );
}
