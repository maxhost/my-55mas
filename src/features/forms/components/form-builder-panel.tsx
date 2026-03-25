'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  const variantCountryIds = new Set(
    variants.map((v) => v.country_id).filter((id): id is string => id !== null)
  );

  const handleVariantChange = (countryId: string | null) => {
    setActiveVariant(countryId);

    if (countryId === null) {
      // Switch to General — load it
      startLoading(async () => {
        const form = await getForm(serviceId, null, false);
        setFormData(form);
      });
      return;
    }

    if (variantCountryIds.has(countryId)) {
      // Variant already exists — load it
      startLoading(async () => {
        const form = await getForm(serviceId, countryId, false);
        setFormData(form);
      });
    } else {
      // No variant yet — auto-clone from General
      startLoading(async () => {
        const result = await cloneFormVariant({
          service_id: serviceId,
          source_country_id: null, // always clone from General
          target_country_id: countryId,
        });
        if (result.data) {
          setFormData(result.data);
          const country = serviceCountries.find((c) => c.id === countryId);
          setVariants((prev) => [
            ...prev,
            {
              id: result.data!.id,
              country_id: countryId,
              country_name: country?.name ?? null,
              version: 1,
            },
          ]);
        }
      });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{t('title')}</h3>

      <VariantSelector
        serviceCountries={serviceCountries}
        activeVariant={activeVariant}
        onVariantChange={handleVariantChange}
        isLoading={isLoading}
      />

      <Tabs value={activeLocale} onValueChange={setActiveLocale}>
        <TabsList>
          {locales.map((locale) => (
            <TabsTrigger key={locale} value={locale}>
              {locale.toUpperCase()}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <p className="text-muted-foreground py-4">{t('cloning')}</p>
      ) : (
        <FormBuilder
          key={formData?.id ?? 'new'}
          serviceId={serviceId}
          countryId={activeVariant}
          form={formData}
          activeLocale={activeLocale}
          onSaved={setFormData}
        />
      )}
    </div>
  );
}
