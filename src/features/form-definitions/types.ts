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
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'multiselect' | 'textarea' | 'checkbox';
  required?: boolean;
  validations?: Record<string, unknown>;
  dataSource?: string;
};

export type FormSchema = {
  fields: FormFieldDefinition[];
};

export type FormI18nFieldEntry = {
  label: string;
  placeholder?: string;
  help?: string;
};

export type FormI18nLocaleEntry = {
  title?: string;
  description?: string;
  submitLabel?: string;
  fields: Record<string, FormI18nFieldEntry>;
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
