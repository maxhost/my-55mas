'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RegistrationFormBuilder } from '@/features/general-forms/components/registration-form-builder';
import { RegistrationFormConfig } from '@/features/general-forms/components/registration-form-config';
import { CatalogFormBuilder } from '@/features/general-forms/components/catalog-form-builder';
import type {
  FormVariantSummary,
  FormCountryOption,
  FormCityOption,
} from '@/shared/lib/forms/types';
import type { SurveyQuestionOption } from '@/shared/components/form-builder/survey-field-config';
import type { RegistrationFormWithTranslations } from '@/features/general-forms/types';
import type { FieldGroupWithFields } from '@/features/field-catalog/types';
import type { CatalogFormSchema } from '@/shared/lib/field-catalog/schema-types';

type Props = {
  formId: string;
  formSlug: string;
  targetRole: 'talent' | 'client';
  form: RegistrationFormWithTranslations | null;
  formVariants: FormVariantSummary[];
  allCountries: FormCountryOption[];
  allCities: FormCityOption[];
  configuredCountryIds: string[];
  configuredCityIds: string[];
  surveyQuestions: SurveyQuestionOption[];
  catalogGroups: FieldGroupWithFields[];
};

export function RegistrationFormEditor({
  formId, formSlug, targetRole, form, formVariants,
  allCountries, allCities,
  configuredCountryIds, configuredCityIds,
  surveyQuestions, catalogGroups,
}: Props) {
  const t = useTranslations('AdminForms');
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
    <Tabs defaultValue="catalog">
      <TabsList>
        <TabsTrigger value="config">{t('tabConfig')}</TabsTrigger>
        <TabsTrigger value="catalog">{t('tabCatalog')}</TabsTrigger>
        <TabsTrigger value="form">{t('tabFormLegacy')}</TabsTrigger>
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
          targetRole={targetRole}
          allCountries={allCountries}
          allCities={allCities}
          configuredCountryIds={configuredCountryIds}
          configuredCityIds={configuredCityIds}
          formVariants={formVariants}
        />
      </TabsContent>

      <TabsContent value="catalog" className="pt-6">
        <CatalogFormBuilder
          formId={formId}
          initialSchema={(form?.schema as unknown as CatalogFormSchema) ?? null}
          groups={catalogGroups}
        />
      </TabsContent>

      <TabsContent value="form" className="pt-6">
        <RegistrationFormBuilder
          formSlug={formSlug}
          targetRole={targetRole}
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
