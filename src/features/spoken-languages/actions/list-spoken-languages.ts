'use server';

// TODO: swap to createClient() when RLS hardening lands project-wide.
// Reason: sl_read_active filters is_active=true, hiding inactive rows from the
// admin CRUD; service role bypasses RLS so the editor can see and reactivate them.
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  ListSpokenLanguagesResult,
  SpokenLanguageLocale,
  SpokenLanguageTranslations,
  SpokenLanguageWithTranslations,
} from '../types';
import { SPOKEN_LANGUAGE_LOCALES } from '../types';

export async function listSpokenLanguages(): Promise<ListSpokenLanguagesResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('spoken_languages')
    .select(
      'code, sort_order, is_active, spoken_language_translations(locale, name)'
    )
    .order('sort_order', { ascending: true });

  if (error) return { ok: false, error: error.message };

  const mapped: SpokenLanguageWithTranslations[] = (data ?? []).map((row) => {
    const rawTrans = row.spoken_language_translations as unknown as
      | { locale: string; name: string }[]
      | null;
    const translations = SPOKEN_LANGUAGE_LOCALES.reduce((acc, locale) => {
      acc[locale] = '';
      return acc;
    }, {} as SpokenLanguageTranslations);

    for (const t of rawTrans ?? []) {
      if ((SPOKEN_LANGUAGE_LOCALES as readonly string[]).includes(t.locale)) {
        translations[t.locale as SpokenLanguageLocale] = t.name;
      }
    }

    return {
      code: row.code,
      sort_order: row.sort_order,
      is_active: row.is_active,
      translations,
    };
  });

  return { ok: true, data: mapped };
}
