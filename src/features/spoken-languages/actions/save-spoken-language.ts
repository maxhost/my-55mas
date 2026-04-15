'use server';

import { revalidatePath } from 'next/cache';
// TODO: swap to createClient() when RLS hardening lands project-wide.
import { createAdminClient } from '@/lib/supabase/admin';
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

  if (language.creating) {
    const { error } = await supabase.from('spoken_languages').insert({
      code: language.code,
      sort_order: language.sort_order,
      is_active: language.is_active,
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
      })
      .eq('code', language.code);
    if (error) return { error: { _db: [error.message] } };
  }

  const translationRows = SPOKEN_LANGUAGE_LOCALES.map((locale) => ({
    language_code: language.code,
    locale,
    name: language.translations[locale],
  }));

  const { error: tErr } = await supabase
    .from('spoken_language_translations')
    .upsert(translationRows, { onConflict: 'language_code,locale' });
  if (tErr) return { error: { _db: [tErr.message] } };

  revalidatePath('/[locale]/(admin)/admin/spoken-languages', 'layout');
  revalidatePath('/[locale]/(admin)/admin/form-builder', 'layout');

  return { data: { code: language.code } };
}
