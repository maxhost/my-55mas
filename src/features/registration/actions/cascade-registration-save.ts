'use server';

import { cascadeSchema, cascadeTranslations, getVariantOnlyFieldKeys } from '@/shared/lib/forms/cascade-helpers';
import { saveRegistrationFormWithTranslations, saveRegistrationForm, saveRegistrationFormTranslations } from './save-registration-form';
import { getRegistrationForm } from './get-registration-form';
import { listRegistrationVariants } from './list-registration-variants';
import type { SaveRegistrationFormInput } from '../types';

/**
 * Saves the General registration form and cascades changes to all city variants.
 * Only call when saving the General form (city_id === null).
 */
export async function cascadeRegistrationSave(input: SaveRegistrationFormInput) {
  const { slug } = input;

  // 1. Load OLD General form (before save)
  const oldGeneral = await getRegistrationForm(slug, null, false);

  // 2. Save new General form + translations
  const saveResult = await saveRegistrationFormWithTranslations(input);
  if ('error' in saveResult && saveResult.error) return saveResult;

  // If there was no old General (first save), no cascade needed
  if (!oldGeneral) return saveResult;

  // 3. Reload new General to get full translations
  const newGeneral = await getRegistrationForm(slug, null, false);
  if (!newGeneral) return saveResult;

  // 4. List all city variants
  const variants = await listRegistrationVariants(slug);
  const cityVariants = variants.filter((v) => v.city_id !== null);
  if (cityVariants.length === 0) return saveResult;

  // 5. Cascade to each city variant
  for (const variant of cityVariants) {
    const cityForm = await getRegistrationForm(slug, variant.city_id, false);
    if (!cityForm) continue;

    const variantOnlyKeys = getVariantOnlyFieldKeys(oldGeneral.schema, cityForm.schema);
    const mergedSchema = cascadeSchema(oldGeneral.schema, newGeneral.schema, cityForm.schema);
    const mergedTranslations = cascadeTranslations(
      oldGeneral.translations,
      newGeneral.translations,
      cityForm.translations,
      variantOnlyKeys,
    );

    await saveRegistrationForm({ slug, city_id: variant.city_id, schema: mergedSchema });

    for (const [locale, data] of Object.entries(mergedTranslations)) {
      await saveRegistrationFormTranslations({
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
