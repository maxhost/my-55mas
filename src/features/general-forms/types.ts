import type { FormSchema, FormTranslationData } from '@/shared/lib/forms/types';

// ── DB-derived types ─────────────────────────────────

export type RegistrationForm = {
  id: string;
  slug: string;
  name: string;
  target_role: 'talent' | 'client';
  city_id: string | null;
  parent_id: string | null;
  schema: FormSchema;
  version: number;
  is_active: boolean;
};

export type RegistrationFormWithTranslations = RegistrationForm & {
  translations: Record<string, FormTranslationData>;
};

// ── List item for admin table ────────────────────────

export type RegistrationFormListItem = {
  id: string;
  name: string;
  slug: string;
  target_role: 'talent' | 'client';
  variant_count: number;
  created_at: string | null;
  updated_at: string | null;
};

// ── Input types for save ─────────────────────────────

export type SaveRegistrationFormInput = {
  slug: string;
  city_id: string | null;
  schema: FormSchema;
  locale: string;
  labels: Record<string, string>;
  placeholders: Record<string, string>;
  option_labels: Record<string, string>;
};

export type SaveRegistrationConfigInput = {
  form_id: string;
  country_ids: string[];
  city_ids: string[];
};
