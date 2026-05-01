import type { Database } from '@/lib/supabase/database.types';

export const FORM_KEYS = [
  'talent_registration',
  'client_registration',
  'service_hire',
  'service_offer',
] as const;

export type FormKey = (typeof FORM_KEYS)[number];

export type FormDefinitionRow = Database['public']['Tables']['form_definitions']['Row'];

export type FormFieldDefinition = {
  key: string;
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'tel'
    | 'number'
    | 'date'
    | 'select'
    | 'multiselect'
    | 'textarea'
    | 'checkbox'
    | 'address'
    | 'display';
  required?: boolean;
  validations?: Record<string, unknown>;
  dataSource?: string;
};

export type FormSchema = {
  fields: FormFieldDefinition[];
};

export type FormI18nFieldEntry = {
  label?: string;
  placeholder?: string;
  help?: string;
  errors?: Record<string, string>;
};

export type FormI18nLocaleEntry = {
  title?: string;
  description?: string;
  submitLabel?: string;
  fields?: Record<string, FormI18nFieldEntry>;
};

export type FormI18n = Record<string, FormI18nLocaleEntry>;

export type FormDefinition = {
  id: string;
  form_key: FormKey;
  schema: FormSchema;
  i18n: FormI18n;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CountryActivation = {
  country_id: string;
  country_code: string;
  country_name: string;
  is_active: boolean;
};

export type FormDefinitionDetail = FormDefinition & {
  activeCountryIds: string[];
};

export type SaveI18nInput = {
  formId: string;
  i18n: FormI18n;
};

export type SaveActivationInput = {
  formId: string;
  is_active: boolean;
  countryIds: string[];
};
