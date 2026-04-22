import type {
  FieldDefinition,
  FieldGroup,
  InputType,
  PersistenceType,
  PersistenceTarget,
} from '@/shared/lib/field-catalog/types';

export const CATALOG_LOCALES = ['es', 'en', 'pt', 'fr', 'ca'] as const;
export type CatalogLocale = (typeof CATALOG_LOCALES)[number];

export type GroupTranslations = Record<CatalogLocale, string>;

export type FieldTranslationEntry = {
  label: string;
  placeholder: string;
  description: string;
  option_labels: Record<string, string> | null;
};
export type FieldTranslations = Record<CatalogLocale, FieldTranslationEntry>;

export type FieldGroupWithFields = FieldGroup & {
  translations: GroupTranslations;
  fields: FieldDefinitionWithTranslations[];
};

export type FieldDefinitionWithTranslations = FieldDefinition & {
  translations: FieldTranslations;
};

export type FieldGroupInput = {
  id: string | null;
  slug: string;
  sort_order: number;
  is_active: boolean;
  translations: GroupTranslations;
};

export type FieldDefinitionInput = {
  id: string | null;
  group_id: string;
  key: string;
  input_type: InputType;
  persistence_type: PersistenceType;
  persistence_target: PersistenceTarget;
  options: string[] | null;
  options_source: string | null;
  sort_order: number;
  is_active: boolean;
  translations: FieldTranslations;
};

// ── Result types ────────────────────────────────────

export type ListFieldCatalogResult =
  | { ok: true; data: FieldGroupWithFields[] }
  | { ok: false; error: string };

export type SaveFieldGroupResult =
  | { ok: true; data: { id: string } }
  | { ok: false; error: string };

export type SaveFieldDefinitionResult =
  | { ok: true; data: { id: string } }
  | { ok: false; error: string };

export type FieldUsage = {
  form_id: string;
  form_type: 'registration' | 'talent';
  city_id: string | null;
  service_id: string | null;
};

export type FindFieldUsageResult =
  | { ok: true; data: FieldUsage[] }
  | { ok: false; error: string };

export type ToggleFieldActiveResult =
  | {
      ok: true;
      data: {
        id: string;
        is_active: boolean;
        usage: FieldUsage[];
      };
    }
  | { ok: false; error: string };
