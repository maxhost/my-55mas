'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RegistrationFormBuilder } from '@/features/registration/components/registration-form-builder';
import { RegistrationFormConfig } from '@/features/registration/components/registration-form-config';
import type {
  FormVariantSummary,
  FormCountryOption,
  FormCityOption,
} from '@/shared/lib/forms/types';
import type { SurveyQuestionOption } from '@/shared/components/form-builder/survey-field-config';
import type { RegistrationFormWithTranslations } from '@/features/registration/types';

type Props = {
  formId: string;
  formSlug: string;
  form: RegistrationFormWithTranslations | null;
  formVariants: FormVariantSummary[];
  allCountries: FormCountryOption[];
  allCities: FormCityOption[];
  configuredCountryIds: string[];
  configuredCityIds: string[];
  surveyQuestions: SurveyQuestionOption[];
};

export function RegistrationFormEditor({
  formId, formSlug, form, formVariants,
  allCountries, allCities,
  configuredCountryIds, configuredCityIds,
  surveyQuestions,
}: Props) {
  const t = useTranslations('AdminRegistration');

  // Derive form-builder-compatible countries/cities from configured IDs
  const serviceCountries = allCountries.filter((c) => configuredCountryIds.includes(c.id));
  const serviceCities = allCities.filter((c) => configuredCityIds.includes(c.id));

  return (
    <Tabs defaultValue="config">
      <TabsList>
        <TabsTrigger value="config">{t('tabConfig')}</TabsTrigger>
        <TabsTrigger value="form">{t('tabForm')}</TabsTrigger>
      </TabsList>

      <TabsContent value="config" className="pt-6">
        <RegistrationFormConfig
          formId={formId}
          allCountries={allCountries}
          allCities={allCities}
          configuredCountryIds={configuredCountryIds}
          configuredCityIds={configuredCityIds}
          formVariants={formVariants}
        />
      </TabsContent>

      <TabsContent value="form" className="pt-6">
        <RegistrationFormBuilder
          formSlug={formSlug}
          form={form}
          formVariants={formVariants}
          serviceCountries={serviceCountries}
          serviceCities={serviceCities}
          surveyQuestions={surveyQuestions}
        />
      </TabsContent>
    </Tabs>
  );
}
