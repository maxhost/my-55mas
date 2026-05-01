'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CountryCode } from 'libphonenumber-js';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { PhoneField } from '../fields/phone';
import { CountryCityField } from '../fields/country-city';
import { AddressField, emptyAddress } from '../fields/address';
import { FiscalIdField } from '../fields/fiscal-id';
import { ServicesField } from '../fields/services';
import { AdditionalInfoInput } from '../fields/additional-info';
import { ConsentSection } from './consent-section';
import { PersonalInfoSection } from './personal-info-section';
import { TalentRegistrationSchema, type TalentRegistrationSchemaInput } from '../schemas';
import type {
  CityOption,
  ServiceOption,
  TalentRegistrationContext,
} from '../types';

type Props = {
  context: TalentRegistrationContext;
  cities: CityOption[];
  loadServices: (countryId: string, cityId?: string) => Promise<ServiceOption[]>;
  onSubmit: (data: TalentRegistrationSchemaInput) => Promise<{ error?: Record<string, string[]> } | void>;
};

const DEFAULT_VALUES: TalentRegistrationSchemaInput = {
  full_name: '',
  email: '',
  password: '',
  phone: '',
  country_id: '',
  city_id: '',
  address: emptyAddress,
  fiscal_id_type_id: '',
  fiscal_id: '',
  services: [],
  additional_info: undefined,
  terms_accepted: true as const,
  marketing_consent: false,
};

function normalize(s: string): string {
  // Strip diacritics by decomposing to NFD and removing combining marks (U+0300-U+036F)
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

export function TalentRegistrationForm({ context, cities, loadServices, onSubmit }: Props) {
  const t = useTranslations('TalentRegistration');
  const fieldsI18n = context.i18n.fields;
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<TalentRegistrationSchemaInput>({
    resolver: zodResolver(TalentRegistrationSchema),
    defaultValues: { ...DEFAULT_VALUES, terms_accepted: false as never },
    mode: 'onBlur',
  });

  const country = form.watch('country_id');
  const city = form.watch('city_id');
  const address = form.watch('address');

  const activeCountryCodes = useMemo(
    () => context.countries.map((c) => c.code).filter(Boolean),
    [context.countries],
  );
  const phoneCountryCodes = activeCountryCodes as CountryCode[];

  const cityNeedsManual =
    Boolean(country) && Boolean(address.city_name) && !city;

  // Derive country_id and city_id whenever Mapbox returns new metadata.
  useEffect(() => {
    if (!address.country_code) return;

    const matchedCountry = context.countries.find(
      (c) => c.code.toLowerCase() === address.country_code,
    );
    if (!matchedCountry) return;

    const nextCountryId = matchedCountry.id;
    let nextCityId = '';
    if (address.city_name) {
      const target = normalize(address.city_name);
      const matchedCity = cities.find(
        (c) => c.country_id === nextCountryId && normalize(c.name) === target,
      );
      if (matchedCity) nextCityId = matchedCity.id;
    }

    if (nextCountryId !== form.getValues('country_id')) {
      form.setValue('country_id', nextCountryId, { shouldValidate: true });
      form.setValue('fiscal_id_type_id', '');
      form.setValue('services', []);
    }
    if (nextCityId !== form.getValues('city_id')) {
      form.setValue('city_id', nextCityId, { shouldValidate: true });
    }
    void refreshServices(nextCountryId, nextCityId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address.country_code, address.city_name]);

  async function refreshServices(countryId: string, cityId: string) {
    if (!countryId) {
      setServices([]);
      return;
    }
    const opts = await loadServices(countryId, cityId || undefined);
    setServices(opts);
  }

  const submit = (data: TalentRegistrationSchemaInput) => {
    setSubmitError(null);
    startTransition(async () => {
      const result = await onSubmit(data);
      if (result?.error) {
        const first = Object.entries(result.error)[0];
        if (first) {
          form.setError(first[0] as keyof TalentRegistrationSchemaInput, {
            message: first[1].join(', '),
          });
        }
        setSubmitError('submit_failed');
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
      {context.i18n.title ? <h2 className="text-2xl font-semibold">{context.i18n.title}</h2> : null}

      <PersonalInfoSection
        control={form.control}
        errors={form.formState.errors}
        fieldsI18n={fieldsI18n}
      />

      <Controller
        control={form.control}
        name="address"
        render={({ field, fieldState }) => (
          <AddressField
            id="address"
            label={fieldsI18n.address?.label ?? 'Dirección'}
            placeholder={fieldsI18n.address?.placeholder}
            help={fieldsI18n.address?.help}
            error={fieldState.error?.message}
            value={field.value}
            onChange={field.onChange}
            required
            countryCodes={activeCountryCodes}
          />
        )}
      />

      <CountryCityField
        countries={context.countries}
        cities={cities}
        countryValue={country}
        cityValue={city}
        onCityChange={(id) => {
          form.setValue('city_id', id, { shouldValidate: true });
          void refreshServices(country, id);
        }}
        countryLabel={fieldsI18n.country_id?.label ?? 'País'}
        cityLabel={fieldsI18n.city_id?.label ?? 'Ciudad'}
        cityPlaceholder={fieldsI18n.city_id?.placeholder}
        cityError={form.formState.errors.city_id?.message}
        notDetectedHint={t('locationNotDetected')}
        manualCityHint={t('cityManualHint')}
        cityNeedsManual={cityNeedsManual}
        required
        cityFieldId="city_id"
      />

      <Controller
        control={form.control}
        name="phone"
        render={({ field, fieldState }) => (
          <PhoneField
            id="phone"
            label={fieldsI18n.phone?.label ?? 'Teléfono'}
            placeholder={fieldsI18n.phone?.placeholder}
            help={fieldsI18n.phone?.help}
            error={fieldState.error?.message}
            value={field.value}
            onChange={field.onChange}
            required
            countryCodes={phoneCountryCodes}
            defaultCountry={
              (context.countries.find((c) => c.id === country)?.code as CountryCode) ||
              phoneCountryCodes[0]
            }
          />
        )}
      />

      <FiscalIdField
        fiscalIdTypes={context.fiscalIdTypes}
        countryId={country}
        typeValue={form.watch('fiscal_id_type_id')}
        valueValue={form.watch('fiscal_id')}
        onTypeChange={(id) => form.setValue('fiscal_id_type_id', id, { shouldValidate: true })}
        onValueChange={(v) => form.setValue('fiscal_id', v, { shouldValidate: true })}
        typeLabel={fieldsI18n.fiscal_id_type_id?.label ?? 'Tipo de ID'}
        valueLabel={fieldsI18n.fiscal_id?.label ?? 'ID fiscal'}
        typePlaceholder={fieldsI18n.fiscal_id_type_id?.placeholder}
        valuePlaceholder={fieldsI18n.fiscal_id?.placeholder}
        typeHelp={fieldsI18n.fiscal_id_type_id?.help}
        typeError={form.formState.errors.fiscal_id_type_id?.message}
        valueError={form.formState.errors.fiscal_id?.message}
        required
        typeFieldId="fiscal_id_type_id"
        valueFieldId="fiscal_id"
      />

      <Controller
        control={form.control}
        name="services"
        render={({ field, fieldState }) => (
          <ServicesField
            options={services}
            value={field.value}
            onChange={field.onChange}
            label={fieldsI18n.services?.label ?? 'Servicios'}
            help={fieldsI18n.services?.help}
            error={fieldState.error?.message}
            required
            emptyMessage={fieldsI18n.services?.placeholder ?? 'Selecciona país y ciudad primero'}
          />
        )}
      />

      <Controller
        control={form.control}
        name="additional_info"
        render={({ field, fieldState }) => (
          <AdditionalInfoInput
            id="additional_info"
            label={fieldsI18n.additional_info?.label ?? 'Información adicional'}
            placeholder={fieldsI18n.additional_info?.placeholder}
            error={fieldState.error?.message}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <ConsentSection
        control={form.control}
        errors={form.formState.errors}
        fieldsI18n={fieldsI18n}
      />

      {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

      <Button type="submit" disabled={isPending} className="w-full">
        {context.i18n.submitLabel ?? 'Registrarme'}
      </Button>
    </form>
  );
}
