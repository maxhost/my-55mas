'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TalentFormBuilder } from '@/features/talent-forms/components/talent-form-builder';
import { TalentFormConfig } from '@/features/talent-forms/components/talent-form-config';
import type {
  FormWithTranslations,
  FormVariantSummary,
  FormCountryOption,
  FormCityOption,
} from '@/shared/lib/forms/types';

type Props = {
  serviceId: string;
  form: FormWithTranslations | null;
  formVariants: FormVariantSummary[];
  serviceCountries: FormCountryOption[];
  serviceCities: FormCityOption[];
};

export function TalentFormEditor({
  serviceId,
  form,
  formVariants,
  serviceCountries,
  serviceCities,
}: Props) {
  const t = useTranslations('AdminTalentForms');

  return (
    <Tabs defaultValue="config">
      <TabsList>
        <TabsTrigger value="config">{t('tabConfig')}</TabsTrigger>
        <TabsTrigger value="form">{t('tabForm')}</TabsTrigger>
      </TabsList>

      <TabsContent value="config" className="pt-6">
        <TalentFormConfig
          serviceCountries={serviceCountries}
          serviceCities={serviceCities}
          formVariants={formVariants}
        />
      </TabsContent>

      <TabsContent value="form" className="pt-6">
        <TalentFormBuilder
          serviceId={serviceId}
          form={form}
          formVariants={formVariants}
          serviceCountries={serviceCountries}
          serviceCities={serviceCities}
        />
      </TabsContent>
    </Tabs>
  );
}
