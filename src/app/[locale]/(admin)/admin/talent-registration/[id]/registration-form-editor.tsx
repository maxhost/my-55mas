'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
  const tc = useTranslations('Common');

  const embedSnippet = `<RegistrationFormEmbed\n  slug="${formSlug}"\n  locale={locale}\n  onSubmit={handleSubmit}\n/>`;

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedSnippet);
    toast.success(tc('copiedSuccess'));
  };

  // Derive form-builder-compatible countries/cities from configured IDs
  const serviceCountries = allCountries.filter((c) => configuredCountryIds.includes(c.id));
  const serviceCities = allCities.filter((c) => configuredCityIds.includes(c.id));

  return (
    <Tabs defaultValue="config">
      <TabsList>
        <TabsTrigger value="config">{t('tabConfig')}</TabsTrigger>
        <TabsTrigger value="form">{t('tabForm')}</TabsTrigger>
      </TabsList>

      <TabsContent value="config" className="space-y-6 pt-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{t('embedCode')}</h3>
          <div className="relative">
            <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">
              {embedSnippet}
            </pre>
            <Button
              variant="ghost"
              size="icon-xs"
              className="absolute right-2 top-2"
              onClick={copyEmbed}
            >
              <Copy className="size-3" />
            </Button>
          </div>
        </div>

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
