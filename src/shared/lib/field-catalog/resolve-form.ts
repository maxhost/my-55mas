import type { CatalogFormSchema, CatalogFieldRef } from './schema-types';
import type {
  FieldDefinition,
  FieldDefinitionTranslation,
  PersistenceTarget,
  InputType,
  PersistenceType,
} from './types';
import type {
  ResolvedAction,
  ResolvedField,
  ResolvedForm,
  ResolvedStep,
} from './resolved-types';
import type { StepAction } from '@/shared/lib/forms/types';
import { loadFormValues } from './load-form-values';
import type { Sb } from './persistence/context';

const FALLBACK_LOCALE = 'es';

/**
 * Per-form labels keyed by step.key and action.key.
 * Step/action labels are per-form (they live in registration_form_translations
 * or talent_form_translations), NOT in the central catalog. The caller is
 * responsible for loading them from the right table and merging locale over
 * fallback ('es'). Missing keys fall back to the structural key itself.
 */
export type FormLabels = Record<string, string>;

export type ResolveFormInput = {
  supabase: Sb;
  schema: CatalogFormSchema;
  userId: string | null;
  locale: string;
  formLabels?: FormLabels;
};

export async function resolveForm(input: ResolveFormInput): Promise<ResolvedForm> {
  const { supabase, schema, userId, locale, formLabels } = input;
  const fieldIds = collectFieldIds(schema);
  const labels: FormLabels = formLabels ?? {};

  const [definitions, translations] = await Promise.all([
    loadDefinitions(supabase, fieldIds),
    loadTranslations(supabase, fieldIds, locale),
  ]);

  const definitionsById = indexDefinitions(definitions);
  const translationsByFieldAndLocale = indexTranslations(translations);

  const resolvedFields = buildResolvedFieldsForAllRefs(
    schema,
    definitionsById,
    translationsByFieldAndLocale,
    locale
  );

  const currentValues = await loadFormValues(supabase, userId, resolvedFields);
  applyCurrentValues(resolvedFields, currentValues);

  const steps: ResolvedStep[] = schema.steps.map((step) => ({
    key: step.key,
    label: labels[step.key] ?? step.key,
    fields: step.field_refs.map(
      (ref) => resolvedFields.find((rf) => matchesRef(rf, ref))!
    ),
    actions: resolveActions(step.actions, labels),
  }));

  return { steps };
}

function resolveActions(
  actions: StepAction[] | undefined,
  labels: FormLabels
): ResolvedAction[] | undefined {
  if (!actions || actions.length === 0) return undefined;
  return actions.map((a) => ({
    key: a.key,
    type: a.type,
    label: labels[a.key] ?? a.key,
    redirect_url: a.redirect_url,
  }));
}

// ── Queries ─────────────────────────────────────────

async function loadDefinitions(
  supabase: Sb,
  fieldIds: string[]
): Promise<FieldDefinition[]> {
  if (fieldIds.length === 0) return [];
  const { data, error } = await supabase
    .from('form_field_definitions')
    .select(
      'id, group_id, key, input_type, persistence_type, persistence_target, options, options_source, sort_order, is_active'
    )
    .in('id', fieldIds);
  if (error) throw new Error(`load definitions: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    group_id: row.group_id,
    key: row.key,
    input_type: row.input_type as InputType,
    persistence_type: row.persistence_type as PersistenceType,
    persistence_target: row.persistence_target as PersistenceTarget,
    options: row.options as string[] | null,
    options_source: row.options_source,
    sort_order: row.sort_order,
    is_active: row.is_active,
  }));
}

async function loadTranslations(
  supabase: Sb,
  fieldIds: string[],
  locale: string
): Promise<FieldDefinitionTranslation[]> {
  if (fieldIds.length === 0) return [];
  const locales = Array.from(new Set([locale, FALLBACK_LOCALE]));
  const { data, error } = await supabase
    .from('form_field_definition_translations')
    .select('field_id, locale, label, placeholder, description, option_labels')
    .in('field_id', fieldIds)
    .in('locale', locales);
  if (error) throw new Error(`load translations: ${error.message}`);
  return (data ?? []) as FieldDefinitionTranslation[];
}

// ── Indexing ────────────────────────────────────────

function collectFieldIds(schema: CatalogFormSchema): string[] {
  const ids = new Set<string>();
  for (const step of schema.steps) {
    for (const ref of step.field_refs) ids.add(ref.field_definition_id);
  }
  return Array.from(ids);
}

function indexDefinitions(
  definitions: FieldDefinition[]
): Map<string, FieldDefinition> {
  return new Map(definitions.map((d) => [d.id, d]));
}

function indexTranslations(
  translations: FieldDefinitionTranslation[]
): Map<string, Map<string, FieldDefinitionTranslation>> {
  const index = new Map<string, Map<string, FieldDefinitionTranslation>>();
  for (const t of translations) {
    if (!index.has(t.field_id)) index.set(t.field_id, new Map());
    index.get(t.field_id)!.set(t.locale, t);
  }
  return index;
}

// ── Building resolved fields ────────────────────────

function buildResolvedFieldsForAllRefs(
  schema: CatalogFormSchema,
  definitionsById: Map<string, FieldDefinition>,
  translationsByFieldAndLocale: Map<string, Map<string, FieldDefinitionTranslation>>,
  locale: string
): ResolvedField[] {
  const all: ResolvedField[] = [];
  for (const step of schema.steps) {
    for (const ref of step.field_refs) {
      const def = definitionsById.get(ref.field_definition_id);
      if (!def) {
        throw new Error(
          `Field definition not found for ref ${ref.field_definition_id}`
        );
      }
      const tr = pickTranslation(
        translationsByFieldAndLocale.get(def.id),
        locale
      );
      all.push(buildResolvedField(def, ref, tr));
    }
  }
  return all;
}

function pickTranslation(
  byLocale: Map<string, FieldDefinitionTranslation> | undefined,
  locale: string
): FieldDefinitionTranslation | undefined {
  if (!byLocale) return undefined;
  return byLocale.get(locale) ?? byLocale.get(FALLBACK_LOCALE);
}

function buildResolvedField(
  def: FieldDefinition,
  ref: CatalogFieldRef,
  tr: FieldDefinitionTranslation | undefined
): ResolvedField {
  return {
    field_definition_id: def.id,
    key: def.key,
    input_type: def.input_type,
    persistence_type: def.persistence_type,
    persistence_target: def.persistence_target,
    required: ref.required,
    label: tr?.label ?? def.key,
    placeholder: tr?.placeholder ?? '',
    description: tr?.description ?? undefined,
    options: def.options,
    options_source: def.options_source,
    option_labels: tr?.option_labels ?? undefined,
  };
}

function matchesRef(field: ResolvedField, ref: CatalogFieldRef): boolean {
  return (
    field.field_definition_id === ref.field_definition_id &&
    field.required === ref.required
  );
}

function applyCurrentValues(
  fields: ResolvedField[],
  values: Record<string, unknown>
): void {
  for (const f of fields) {
    if (f.field_definition_id in values) {
      f.current_value = values[f.field_definition_id];
    }
  }
}
