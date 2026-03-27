'use client';

import { useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { locales } from '@/lib/i18n/config';
import type {
  FormWithTranslations,
  FormVariantSummary,
  FormCountryOption,
  FormCityOption,
  SaveFormResult,
  CloneFormResult,
} from '@/shared/lib/forms/types';
import type { SaveFormWithTranslationsInput } from '@/shared/lib/forms/schemas';
import { VariantSelector } from './variant-selector';
import { FormBuilder } from './form-builder';
import type { SubtypeGroupOption } from './subtype-field-config';

type Props = {
  serviceId: string;
  form: FormWithTranslations | null;
  formVariants: FormVariantSummary[];
  serviceCountries: FormCountryOption[];
  serviceCities: FormCityOption[];
  subtypeGroups?: SubtypeGroupOption[];
  // Callbacks — injected by feature wrapper
  onGetForm: (serviceId: string, cityId: string | null, fallback?: boolean) => Promise<FormWithTranslations | null>;
  onCloneVariant: (input: { service_id: string; source_city_id: string | null; target_city_id: string }) => Promise<CloneFormResult>;
  onSave: (input: SaveFormWithTranslationsInput) => Promise<SaveFormResult>;
};

export function FormBuilderPanel({
  serviceId,
  form: initialForm,
  formVariants: initialVariants,
  serviceCountries,
  serviceCities,
  subtypeGroups,
  onGetForm,
  onCloneVariant,
  onSave,
}: Props) {
  const t = useTranslations('AdminFormBuilder');
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [activeLocale, setActiveLocale] = useState<string>(locales[0]);
  const [formData, setFormData] = useState<FormWithTranslations | null>(initialForm);
  const [variants, setVariants] = useState(initialVariants);
  const [isLoading, startLoading] = useTransition();
  const isCloningRef = useRef(false);

  const variantCityIds = new Set(
    variants.map((v) => v.city_id).filter((id): id is string => id !== null)
  );

  const handleCountryChange = (countryId: string | null) => {
    setActiveCountry(countryId);
  };

  const handleCityChange = (cityId: string | null) => {
    setActiveCity(cityId);

    if (cityId === null && activeCountry === null) {
      // Switch to General — load it
      isCloningRef.current = false;
      startLoading(async () => {
        const form = await onGetForm(serviceId, null, false);
        setFormData(form);
      });
      return;
    }

    // Empty string means "select a city" placeholder — don't load anything
    if (!cityId) return;

    if (variantCityIds.has(cityId)) {
      // Variant already exists — load it
      isCloningRef.current = false;
      startLoading(async () => {
        const form = await onGetForm(serviceId, cityId, false);
        setFormData(form);
      });
    } else {
      // No variant yet — auto-clone from General
      isCloningRef.current = true;
      startLoading(async () => {
        const result = await onCloneVariant({
          service_id: serviceId,
          source_city_id: null,
          target_city_id: cityId,
        });
        if (result.data) {
          setFormData(result.data);
          const city = serviceCities.find((c) => c.id === cityId);
          setVariants((prev) => [
            ...prev,
            {
              id: result.data!.id,
              city_id: cityId,
              city_name: city?.name ?? null,
              country_id: city?.country_id ?? null,
              version: 1,
              is_active: true,
            },
          ]);
        }
      });
    }
  };

  const handleGetForm = (svcId: string, cId: string | null) =>
    onGetForm(svcId, cId, false);

  // Determine if we should show the form builder
  const showBuilder = activeCountry === null || (activeCountry !== null && !!activeCity);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{t('title')}</h3>

      <VariantSelector
        serviceCountries={serviceCountries}
        serviceCities={serviceCities}
        activeCountry={activeCountry}
        activeCity={activeCity}
        onCountryChange={handleCountryChange}
        onCityChange={handleCityChange}
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

      {isLoading && isCloningRef.current ? (
        <p className="text-muted-foreground py-4">{t('cloning')}</p>
      ) : showBuilder ? (
        <FormBuilder
          key={formData?.id ?? 'new'}
          serviceId={serviceId}
          cityId={activeCity}
          form={formData}
          activeLocale={activeLocale}
          subtypeGroups={subtypeGroups ?? []}
          onSaved={setFormData}
          onSave={onSave}
          onGetForm={handleGetForm}
        />
      ) : null}
    </div>
  );
}
