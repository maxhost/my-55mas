'use server';

import type { SaveFormWithTranslationsInput } from '../schemas';
import { saveFormWithTranslations } from './save-form';
import { getForm } from './get-form';
import { listFormVariants } from './list-form-variants';
import { saveForm, saveFormTranslations } from './save-form';
import { cascadeSchema, cascadeTranslations, getVariantOnlyFieldKeys } from './cascade-helpers';

/**
 * Saves the General form and cascades structural + translation changes
 * to all country variants.
 *
 * Only call this when saving the General form (city_id === null).
 */
export async function cascadeGeneralSave(input: SaveFormWithTranslationsInput) {
  const { service_id } = input;

  // 1. Load OLD General form (before save)
  const oldGeneral = await getForm(service_id, null, false);

  // 2. Save new General form + translations
  const saveResult = await saveFormWithTranslations(input);
  if ('error' in saveResult && saveResult.error) return saveResult;

  // If there was no old General (first save), no cascade needed
  if (!oldGeneral) return saveResult;

  // 3. Reload new General to get full translations
  const newGeneral = await getForm(service_id, null, false);
  if (!newGeneral) return saveResult;

  // 4. List all city variants
  const variants = await listFormVariants(service_id);
  const cityVariants = variants.filter((v) => v.city_id !== null);
  if (cityVariants.length === 0) return saveResult;

  // 5. Cascade to each city variant
  for (const variant of cityVariants) {
    const cityForm = await getForm(service_id, variant.city_id, false);
    if (!cityForm) continue;

    const variantOnlyKeys = getVariantOnlyFieldKeys(oldGeneral.schema, cityForm.schema);
    const mergedSchema = cascadeSchema(oldGeneral.schema, newGeneral.schema, cityForm.schema);
    const mergedTranslations = cascadeTranslations(
      oldGeneral.translations,
      newGeneral.translations,
      cityForm.translations,
      variantOnlyKeys,
    );

    // Save updated city schema
    await saveForm({ service_id, city_id: variant.city_id, schema: mergedSchema });

    // Save updated city translations (all locales)
    for (const [locale, data] of Object.entries(mergedTranslations)) {
      await saveFormTranslations({
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
