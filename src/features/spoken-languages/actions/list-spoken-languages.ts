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

type I18nEntry = { name?: string } | null;
type I18nRecord = Record<string, I18nEntry> | null;

export async function listSpokenLanguages(): Promise<ListSpokenLanguagesResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('spoken_languages')
    .select('code, sort_order, is_active, i18n')
    .order('sort_order', { ascending: true });

  if (error) return { ok: false, error: error.message };

  const mapped: SpokenLanguageWithTranslations[] = (data ?? []).map((row) => {
    const i18n = (row.i18n ?? {}) as I18nRecord;
    const translations = SPOKEN_LANGUAGE_LOCALES.reduce((acc, locale) => {
      acc[locale] = '';
      return acc;
    }, {} as SpokenLanguageTranslations);

    if (i18n) {
      for (const locale of SPOKEN_LANGUAGE_LOCALES) {
        const name = i18n[locale]?.name;
        if (typeof name === 'string') {
          translations[locale as SpokenLanguageLocale] = name;
        }
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
