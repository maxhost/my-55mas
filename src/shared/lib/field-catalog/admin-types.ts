import type { FieldDefinition, FieldGroup } from './types';

// Tipos "ricos" del catálogo que consumen pages / builders externos al
// feature admin. Viven en shared/ para no obligar a features/* a importar
// del feature field-catalog (regla de boundaries).

export const CATALOG_LOCALES = ['es', 'en', 'pt', 'fr', 'ca'] as const;
export type CatalogLocale = (typeof CATALOG_LOCALES)[number];

export type CatalogGroupTranslations = Record<CatalogLocale, string>;

export type CatalogFieldTranslationEntry = {
  label: string;
  placeholder: string;
  description: string;
  option_labels: Record<string, string> | null;
};
export type CatalogFieldTranslations = Record<
  CatalogLocale,
  CatalogFieldTranslationEntry
>;

export type FieldDefinitionWithTranslations = FieldDefinition & {
  translations: CatalogFieldTranslations;
};

export type FieldGroupWithFields = FieldGroup & {
  translations: CatalogGroupTranslations;
  fields: FieldDefinitionWithTranslations[];
};
