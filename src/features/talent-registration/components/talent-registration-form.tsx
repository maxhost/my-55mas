'use client';

import { useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CountryCode } from 'libphonenumber-js';
import { Button } from '@/components/ui/button';
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
  terms_accepted: true as const, // satisfies the schema's literal(true)
  marketing_consent: false,
};

export function TalentRegistrationForm({ context, cities, loadServices, onSubmit }: Props) {
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
  const countryCode = context.countries.find((c) => c.id === country)?.code ?? '';
  const phoneCountryCodes = context.countries
    .map((c) => c.code as CountryCode)
    .filter(Boolean);

  const handleCountryCityChange = async (newCountryId: string, newCityId: string) => {
    if (newCountryId && newCityId) {
      const opts = await loadServices(newCountryId, newCityId);
      setServices(opts);
    } else if (newCountryId) {
      const opts = await loadServices(newCountryId);
      setServices(opts);
    } else {
      setServices([]);
    }
  };

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
            defaultCountry={(countryCode as CountryCode) || phoneCountryCodes[0]}
          />
        )}
      />

      <CountryCityField
        countries={context.countries}
        cities={cities}
        countryValue={country}
        cityValue={city}
        onCountryChange={(id) => {
          form.setValue('country_id', id);
          form.setValue('city_id', '');
          form.setValue('fiscal_id_type_id', '');
          form.setValue('services', []);
          handleCountryCityChange(id, '');
        }}
        onCityChange={(id) => {
          form.setValue('city_id', id);
          handleCountryCityChange(country, id);
        }}
        countryLabel={fieldsI18n.country_id?.label ?? 'País'}
        cityLabel={fieldsI18n.city_id?.label ?? 'Ciudad'}
        countryPlaceholder={fieldsI18n.country_id?.placeholder}
        cityPlaceholder={fieldsI18n.city_id?.placeholder}
        countryError={form.formState.errors.country_id?.message}
        cityError={form.formState.errors.city_id?.message}
        required
        countryFieldId="country_id"
        cityFieldId="city_id"
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
            countryCode={countryCode}
            disabled={!countryCode}
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
