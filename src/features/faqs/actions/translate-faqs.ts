'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import type { TranslationTarget } from '@/shared/lib/translation';
import { faqInputSchema } from '../schemas';
import {
  translateFaqsTranslations,
  type FaqTranslationItem,
} from '../lib/translate-faqs-with-claude';
import type { FaqInput, FaqTranslation } from '../types';

const TARGET_LOCALES: readonly TranslationTarget[] = [
  'en',
  'pt',
  'fr',
  'ca',
] as const;
const MAX_FAQS_WITH_ES = 50;

type Result =
  | { data: { translatedLocales: TranslationTarget[] } }
  | {
      error:
        | 'invalid-input'
        | 'es-incomplete'
        | 'too-many-faqs'
        | 'translate-failed'
        | 'db-failed';
    };

const inputSchema = z.object({
  faqs: z.array(faqInputSchema),
});

type Input = z.input<typeof inputSchema>;

function hasEsContent(f: FaqInput): boolean {
  return Boolean(
    f.id &&
      f.translations.es?.question?.trim() &&
      f.translations.es?.answer?.trim(),
  );
}

function buildItems(faqs: FaqInput[]): FaqTranslationItem[] {
  return faqs
    .filter(hasEsContent)
    .map((f) => ({
      id: f.id!,
      question: f.translations.es!.question.trim(),
      answer: f.translations.es!.answer.trim(),
    }));
}

async function translateAll(
  items: FaqTranslationItem[],
): Promise<Record<TranslationTarget, FaqTranslationItem[]>> {
  const entries = await Promise.all(
    TARGET_LOCALES.map(async (locale) => {
      const result = await translateFaqsTranslations(items, locale);
      return [locale, result] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<
    TranslationTarget,
    FaqTranslationItem[]
  >;
}

function buildI18nForFaq(
  faq: FaqInput,
  byLocale: Record<TranslationTarget, FaqTranslationItem[]>,
): Record<string, FaqTranslation> {
  const i18n: Record<string, FaqTranslation> = {};
  // Preserve ES from form (auto-save).
  i18n.es = {
    question: faq.translations.es!.question.trim(),
    answer: faq.translations.es!.answer.trim(),
  };
  for (const locale of TARGET_LOCALES) {
    const translated = byLocale[locale].find((t) => t.id === faq.id);
    if (!translated) {
      console.warn('[translate-faqs] missing translation', {
        faqId: faq.id,
        locale,
      });
      // Preserve existing target i18n if it had content.
      const existing = faq.translations[locale];
      if (existing?.question && existing?.answer) {
        i18n[locale] = existing;
      }
      continue;
    }
    i18n[locale] = {
      question: translated.question,
      answer: translated.answer,
    };
  }
  return i18n;
}

export async function translateFaqs(input: Input): Promise<Result> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'invalid-input' };
  }
  const { faqs } = parsed.data;

  const items = buildItems(faqs);
  if (items.length === 0) {
    return { error: 'es-incomplete' };
  }
  if (items.length > MAX_FAQS_WITH_ES) {
    return { error: 'too-many-faqs' };
  }

  let byLocale: Record<TranslationTarget, FaqTranslationItem[]>;
  try {
    byLocale = await translateAll(items);
  } catch {
    return { error: 'translate-failed' };
  }

  const supabase = createClient();
  for (const faq of faqs) {
    if (!faq.id || !hasEsContent(faq)) continue;
    const i18n = buildI18nForFaq(faq, byLocale);
    const { error } = await supabase
      .from('faqs')
      .update({
        sort_order: faq.sort_order,
        is_active: faq.is_active,
        i18n: i18n as unknown as Json,
      })
      .eq('id', faq.id);
    if (error) return { error: 'db-failed' };
  }

  revalidatePath('/[locale]/(admin)/admin/faq', 'layout');
  return { data: { translatedLocales: [...TARGET_LOCALES] } };
}
