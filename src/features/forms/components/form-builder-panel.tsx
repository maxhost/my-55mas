'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { locales } from '@/lib/i18n/config';
import { getForm } from '../actions/get-form';
import { cloneFormVariant } from '../actions/clone-form-variant';
import type {
  FormWithTranslations,
  FormVariantSummary,
  FormCountryOption,
} from '../types';
import { VariantSelector } from './variant-selector';
import { FormBuilder } from './form-builder';

type Props = {
  serviceId: string;
  form: FormWithTranslations | null;
  formVariants: FormVariantSummary[];
  serviceCountries: FormCountryOption[];
};

export function FormBuilderPanel({
  serviceId,
  form: initialForm,
  formVariants: initialVariants,
  serviceCountries,
}: Props) {
  const t = useTranslations('AdminFormBuilder');
  const [activeVariant, setActiveVariant] = useState<string | null>(null);
  const [activeLocale, setActiveLocale] = useState<string>(locales[0]);
  const [formData, setFormData] = useState<FormWithTranslations | null>(initialForm);
  const [variants, setVariants] = useState(initialVariants);
  const [isLoading, startLoading] = useTransition();
  const [isCreating, startCreating] = useTransition();

  const handleVariantChange = (countryId: string | null) => {
    setActiveVariant(countryId);
    startLoading(async () => {
      const form = await getForm(serviceId, countryId, false);
      setFormData(form);
    });
  };

  const handleCreateVariant = (targetCountryId: string) => {
    startCreating(async () => {
      const result = await cloneFormVariant({
        service_id: serviceId,
        source_country_id: activeVariant,
        target_country_id: targetCountryId,
      });
      if (result.data) {
        setFormData(result.data);
        setActiveVariant(targetCountryId);
        // Add new variant to the list
        const country = serviceCountries.find((c) => c.id === targetCountryId);
        setVariants((prev) => [
          ...prev,
          {
            id: result.data!.id,
            country_id: targetCountryId,
            country_name: country?.name ?? null,
            version: 1,
          },
        ]);
      }
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{t('title')}</h3>

      <VariantSelector
        variants={variants}
        serviceCountries={serviceCountries}
        activeVariant={activeVariant}
        onVariantChange={handleVariantChange}
        onCreateVariant={handleCreateVariant}
        isCreating={isCreating}
      />

      <Tabs value={activeLocale} onValueChange={setActiveLocale}>
        <TabsList>
          {locales.map((locale) => (
            <TabsTrigger key={locale} value={locale}>
              {locale.toUpperCase()}
            </TabsTrigger>
          ))}
        </TabsList>

        {locales.map((locale) => (
          <TabsContent key={locale} value={locale} className="pt-4">
            {isLoading ? (
              <p className="text-muted-foreground py-4">{t('cloning')}</p>
            ) : (
              <FormBuilder
                serviceId={serviceId}
                countryId={activeVariant}
                form={formData}
                activeLocale={locale}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
