'use server';

import { createClient } from '@/lib/supabase/server';
import type { ReviewWithTranslations } from '../types';

type I18nTextRecord = Record<string, { text?: string } | null> | null;

function flattenTexts(i18n: I18nTextRecord): Record<string, string> {
  const out: Record<string, string> = {};
  if (!i18n) return out;
  for (const [locale, entry] of Object.entries(i18n)) {
    const t = entry?.text;
    if (typeof t === 'string') out[locale] = t;
  }
  return out;
}

// Returns all reviews (including inactive) ordered by sort_order ASC then
// created_at DESC. Admin sees everything; public layer filters elsewhere.
export async function listReviews(): Promise<ReviewWithTranslations[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('reviews')
    .select('id, author_name, author_photo, stars, sort_order, is_active, i18n, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    author_name: row.author_name,
    author_photo: row.author_photo,
    stars: Number(row.stars),
    sort_order: row.sort_order,
    is_active: row.is_active,
    translations: flattenTexts(row.i18n as I18nTextRecord),
  }));
}
