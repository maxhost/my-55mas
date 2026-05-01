'use server';

import { revalidatePath } from 'next/cache';
// TODO: swap to createClient() when RLS hardening lands project-wide.
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/database.types';
import { saveSpokenLanguageSchema } from '../schemas';
import { SPOKEN_LANGUAGE_LOCALES } from '../types';
import type { SaveSpokenLanguageInput, SaveSpokenLanguageResult } from '../types';

const UNIQUE_VIOLATION = '23505';

export async function saveSpokenLanguage(
  input: SaveSpokenLanguageInput
): Promise<SaveSpokenLanguageResult> {
  const parsed = saveSpokenLanguageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { language } = parsed.data;
  const supabase = createAdminClient();

  const i18n = SPOKEN_LANGUAGE_LOCALES.reduce<Record<string, { name: string }>>(
    (acc, locale) => {
      acc[locale] = { name: language.translations[locale] };
      return acc;
    },
    {}
  ) as unknown as Json;

  if (language.creating) {
    const { error } = await supabase.from('spoken_languages').insert({
      code: language.code,
      sort_order: language.sort_order,
      is_active: language.is_active,
      i18n,
    });
    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        return { error: { code: ['duplicateCode'] } };
      }
      return { error: { _db: [error.message] } };
    }
  } else {
    const { error } = await supabase
      .from('spoken_languages')
      .update({
        sort_order: language.sort_order,
        is_active: language.is_active,
        i18n,
      })
      .eq('code', language.code);
    if (error) return { error: { _db: [error.message] } };
  }

  revalidatePath('/[locale]/(admin)/admin/spoken-languages', 'layout');

  return { data: { code: language.code } };
}
