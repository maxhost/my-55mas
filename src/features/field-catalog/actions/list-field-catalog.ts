'use server';

// TODO: swap to createClient() when RLS hardening lands project-wide.
// Reason: admin CRUD needs to see inactive groups/fields; service role bypass RLS.
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  InputType,
  PersistenceTarget,
  PersistenceType,
} from '@/shared/lib/field-catalog/types';
import {
  CATALOG_LOCALES,
  type CatalogLocale,
  type FieldDefinitionWithTranslations,
  type FieldGroupWithFields,
  type FieldTranslationEntry,
  type FieldTranslations,
  type GroupTranslations,
  type ListFieldCatalogResult,
} from '../types';

const EMPTY_FIELD_TRANSLATION: FieldTranslationEntry = {
  label: '',
  placeholder: '',
  description: '',
  option_labels: null,
};

function emptyGroupTranslations(): GroupTranslations {
  return CATALOG_LOCALES.reduce(
    (acc, l) => ({ ...acc, [l]: '' }),
    {} as GroupTranslations
  );
}

function emptyFieldTranslations(): FieldTranslations {
  return CATALOG_LOCALES.reduce(
    (acc, l) => ({ ...acc, [l]: { ...EMPTY_FIELD_TRANSLATION } }),
    {} as FieldTranslations
  );
}

function isCatalogLocale(locale: string): locale is CatalogLocale {
  return (CATALOG_LOCALES as readonly string[]).includes(locale);
}

export async function listFieldCatalog(): Promise<ListFieldCatalogResult> {
  const supabase = createAdminClient();

  const { data: groups, error: gErr } = await supabase
    .from('form_field_groups')
    .select(
      'id, slug, sort_order, is_active, form_field_group_translations(locale, name)'
    )
    .order('sort_order', { ascending: true });
  if (gErr) return { ok: false, error: gErr.message };

  const { data: defs, error: dErr } = await supabase
    .from('form_field_definitions')
    .select(
      'id, group_id, key, input_type, persistence_type, persistence_target, options, options_source, sort_order, is_active, form_field_definition_translations(locale, label, placeholder, description, option_labels)'
    )
    .order('sort_order', { ascending: true });
  if (dErr) return { ok: false, error: dErr.message };

  const fieldsByGroup = new Map<string, FieldDefinitionWithTranslations[]>();
  for (const def of defs ?? []) {
    const translations = emptyFieldTranslations();
    const rawTrans = def.form_field_definition_translations as unknown as
      | {
          locale: string;
          label: string | null;
          placeholder: string | null;
          description: string | null;
          option_labels: Record<string, string> | null;
        }[]
      | null;
    for (const t of rawTrans ?? []) {
      if (isCatalogLocale(t.locale)) {
        translations[t.locale] = {
          label: t.label ?? '',
          placeholder: t.placeholder ?? '',
          description: t.description ?? '',
          option_labels: t.option_labels,
        };
      }
    }
    const mapped: FieldDefinitionWithTranslations = {
      id: def.id,
      group_id: def.group_id,
      key: def.key,
      input_type: def.input_type as InputType,
      persistence_type: def.persistence_type as PersistenceType,
      persistence_target: def.persistence_target as PersistenceTarget,
      options: def.options as string[] | null,
      options_source: def.options_source,
      sort_order: def.sort_order,
      is_active: def.is_active,
      translations,
    };
    if (!fieldsByGroup.has(def.group_id)) fieldsByGroup.set(def.group_id, []);
    fieldsByGroup.get(def.group_id)!.push(mapped);
  }

  const result: FieldGroupWithFields[] = (groups ?? []).map((g) => {
    const translations = emptyGroupTranslations();
    const rawTrans = g.form_field_group_translations as unknown as
      | { locale: string; name: string }[]
      | null;
    for (const t of rawTrans ?? []) {
      if (isCatalogLocale(t.locale)) translations[t.locale] = t.name;
    }
    return {
      id: g.id,
      slug: g.slug,
      sort_order: g.sort_order,
      is_active: g.is_active,
      translations,
      fields: fieldsByGroup.get(g.id) ?? [],
    };
  });

  return { ok: true, data: result };
}
