'use server';

import type { SaveFormWithTranslationsInput } from '../schemas';
import { saveFormWithTranslations } from './save-form';
import { getForm } from './get-form';
import { listFormVariants } from './list-form-variants';
import { saveForm, saveFormTranslations } from './save-form';
import { cascadeSchema, cascadeTranslations, getCountryOnlyFieldKeys } from './cascade-helpers';

/**
 * Saves the General form and cascades structural + translation changes
 * to all country variants.
 *
 * Only call this when saving the General form (country_id === null).
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

  // 4. List all country variants
  const variants = await listFormVariants(service_id);
  const countryVariants = variants.filter((v) => v.country_id !== null);
  if (countryVariants.length === 0) return saveResult;

  // 5. Cascade to each country variant
  for (const variant of countryVariants) {
    const countryForm = await getForm(service_id, variant.country_id, false);
    if (!countryForm) continue;

    const countryOnlyKeys = getCountryOnlyFieldKeys(oldGeneral.schema, countryForm.schema);
    const mergedSchema = cascadeSchema(oldGeneral.schema, newGeneral.schema, countryForm.schema);
    const mergedTranslations = cascadeTranslations(
      oldGeneral.translations,
      newGeneral.translations,
      countryForm.translations,
      countryOnlyKeys,
    );

    // Save updated country schema
    await saveForm({ service_id, country_id: variant.country_id, schema: mergedSchema });

    // Save updated country translations (all locales)
    for (const [locale, data] of Object.entries(mergedTranslations)) {
      await saveFormTranslations({
        form_id: countryForm.id,
        locale,
        labels: data.labels,
        placeholders: data.placeholders,
        option_labels: data.option_labels,
      });
    }
  }

  return saveResult;
}
