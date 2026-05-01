import type { AddressValue } from '@/shared/components/address-autocomplete';
import type { FormFieldsI18n, FormFieldI18n } from '@/shared/lib/i18n/form-errors';

export type FieldProps<T> = {
  id?: string;
  label: string;
  placeholder?: string;
  help?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  value: T;
  onChange: (value: T) => void;
};

export type CountryOption = { id: string; code: string; name: string };
export type CityOption = { id: string; country_id: string; name: string };
export type FiscalIdTypeOption = {
  id: string;
  code: string;
  label: string;
  countryIds: string[];
};
export type ServiceOption = { id: string; slug: string; name: string };

export type TalentRegistrationContext = {
  formDefinitionId: string;
  schema: { fields: { key: string; type: string; required: boolean }[] };
  i18n: {
    title?: string;
    submitLabel?: string;
    fields: FormFieldsI18n;
  };
  countries: CountryOption[];
  fiscalIdTypes: FiscalIdTypeOption[];
};

export type TalentRegistrationInput = {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  country_id: string;
  city_id: string;
  address: AddressValue;
  fiscal_id_type_id: string;
  fiscal_id: string;
  services: string[];
  additional_info?: string;
  terms_accepted: true;
  marketing_consent: boolean;
};

export type FieldI18n = FormFieldI18n & { content?: string };
