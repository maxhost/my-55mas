'use server';

import { createClient } from '@/lib/supabase/server';
import type { FaqTranslation, FaqWithTranslations } from '../types';

type I18nFaqRecord =
  | Record<string, { question?: string; answer?: string } | null>
  | null;

function flattenTranslations(
  i18n: I18nFaqRecord,
): Record<string, FaqTranslation> {
  const out: Record<string, FaqTranslation> = {};
  if (!i18n) return out;
  for (const [locale, entry] of Object.entries(i18n)) {
    const q = entry?.question;
    const a = entry?.answer;
    if (typeof q === 'string' && typeof a === 'string') {
      out[locale] = { question: q, answer: a };
    }
  }
  return out;
}

export async function listFaqs(): Promise<FaqWithTranslations[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('faqs')
    .select('id, sort_order, is_active, i18n, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    sort_order: row.sort_order,
    is_active: row.is_active,
    translations: flattenTranslations(row.i18n as I18nFaqRecord),
  }));
}
