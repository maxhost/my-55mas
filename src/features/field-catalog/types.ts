import type {
  InputType,
  PersistenceType,
  PersistenceTarget,
} from '@/shared/lib/field-catalog/types';
import {
  CATALOG_LOCALES,
  type CatalogFieldTranslationEntry as FieldTranslationEntry,
  type CatalogFieldTranslations as FieldTranslations,
  type CatalogGroupTranslations as GroupTranslations,
  type CatalogLocale,
  type FieldDefinitionWithTranslations,
  type FieldGroupWithFields,
} from '@/shared/lib/field-catalog/admin-types';

// Re-exports para que el feature admin pueda seguir importando de 'types'
// sin conocer admin-types. Los consumidores externos (pages/builders de
// otros features) importan directamente de shared/lib/field-catalog/admin-types.
export { CATALOG_LOCALES };
export type {
  CatalogLocale,
  FieldTranslationEntry,
  FieldTranslations,
  GroupTranslations,
  FieldDefinitionWithTranslations,
  FieldGroupWithFields,
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
  config: Record<string, unknown> | null;
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
