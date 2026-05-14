import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { localize } from '@/shared/lib/i18n/localize';

export type PublicFaq = { id: string; question: string; answer: string };

type FaqI18n = Record<string, { question?: string; answer?: string }>;

// Graceful degradation: log + return [] if DB fails. The page renders a
// localized empty-state instead of crashing.
export async function loadPublicFaqs(
  locale: string,
): Promise<PublicFaq[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('faqs')
      .select('id, sort_order, is_active, i18n, created_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[loadPublicFaqs] db error', { message: error.message });
      return [];
    }

    const out: PublicFaq[] = [];
    for (const row of data ?? []) {
      const entry = localize(row.i18n as unknown as FaqI18n, locale);
      const q = entry?.question?.trim();
      const a = entry?.answer?.trim();
      if (!q || !a) continue;
      out.push({ id: row.id, question: q, answer: a });
    }
    return out;
  } catch (err) {
    console.error('[loadPublicFaqs] unexpected throw', {
      message: (err as Error)?.message,
    });
    return [];
  }
}
