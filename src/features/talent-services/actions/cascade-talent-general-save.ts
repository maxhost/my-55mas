'use server';

import type { SaveFormWithTranslationsInput } from '@/shared/lib/forms/schemas';
import { cascadeSchema, cascadeTranslations, getVariantOnlyFieldKeys } from '@/shared/lib/forms/cascade-helpers';
import { saveTalentFormWithTranslations, saveTalentForm, saveTalentFormTranslations } from './save-talent-form';
import { getTalentForm } from './get-talent-form';
import { listTalentFormVariants } from './list-talent-form-variants';

/**
 * Saves the General talent form and cascades changes to all city variants.
 * Only call when saving the General form (city_id === null).
 */
export async function cascadeTalentGeneralSave(input: SaveFormWithTranslationsInput) {
  const { service_id } = input;

  // 1. Load OLD General form (before save)
  const oldGeneral = await getTalentForm(service_id, null, false);

  // 2. Save new General form + translations
  const saveResult = await saveTalentFormWithTranslations(input);
  if ('error' in saveResult && saveResult.error) return saveResult;

  // If there was no old General (first save), no cascade needed
  if (!oldGeneral) return saveResult;

  // 3. Reload new General to get full translations
  const newGeneral = await getTalentForm(service_id, null, false);
  if (!newGeneral) return saveResult;

  // 4. List all city variants
  const variants = await listTalentFormVariants(service_id);
  const cityVariants = variants.filter((v) => v.city_id !== null);
  if (cityVariants.length === 0) return saveResult;

  // 5. Cascade to each city variant
  for (const variant of cityVariants) {
    const cityForm = await getTalentForm(service_id, variant.city_id, false);
    if (!cityForm) continue;

    const variantOnlyKeys = getVariantOnlyFieldKeys(oldGeneral.schema, cityForm.schema);
    const mergedSchema = cascadeSchema(oldGeneral.schema, newGeneral.schema, cityForm.schema);
    const mergedTranslations = cascadeTranslations(
      oldGeneral.translations,
      newGeneral.translations,
      cityForm.translations,
      variantOnlyKeys,
    );

    await saveTalentForm({ service_id, city_id: variant.city_id, schema: mergedSchema });

    for (const [locale, data] of Object.entries(mergedTranslations)) {
      await saveTalentFormTranslations({
        form_id: cityForm.id,
        locale,
        labels: data.labels,
        placeholders: data.placeholders,
        option_labels: data.option_labels,
      });
    }
  }

  return saveResult;
}
