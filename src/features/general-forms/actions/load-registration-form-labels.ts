'use server';

import type { Sb } from '@/shared/lib/field-catalog/persistence/context';
import type { FormLabels } from '@/shared/lib/field-catalog/resolve-form';

const FALLBACK_LOCALE = 'es';

// Carga labels de un registration_form para un locale con fallback a 'es'.
// Mergea: { ...esLabels, ...localeLabels } (locale sobreescribe).
// Keys son step.key y action.key del CatalogFormSchema.
export async function loadRegistrationFormLabels(
  supabase: Sb,
  formId: string,
  locale: string
): Promise<FormLabels> {
  const locales = Array.from(new Set([locale, FALLBACK_LOCALE]));
  const { data, error } = await supabase
    .from('registration_form_translations')
    .select('locale, labels')
    .eq('form_id', formId)
    .in('locale', locales);
  if (error || !data) return {};

  const byLocale = new Map<string, Record<string, string>>();
  for (const row of data) {
    byLocale.set(row.locale, (row.labels as Record<string, string>) ?? {});
  }
  return {
    ...(byLocale.get(FALLBACK_LOCALE) ?? {}),
    ...(byLocale.get(locale) ?? {}),
  };
}
