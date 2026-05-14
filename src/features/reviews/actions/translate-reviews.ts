'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import type { TranslationTarget } from '@/shared/lib/translation';
import { reviewInputSchema } from '../schemas';
import {
  translateReviewsTranslations,
  type ReviewTranslationItem,
} from '../lib/translate-reviews-with-claude';
import type { ReviewInput } from '../types';

const TARGET_LOCALES: readonly TranslationTarget[] = [
  'en',
  'pt',
  'fr',
  'ca',
] as const;
const MAX_REVIEWS_WITH_ES = 50;

type Result =
  | { data: { translatedLocales: TranslationTarget[] } }
  | {
      error:
        | 'invalid-input'
        | 'es-incomplete'
        | 'too-many-reviews'
        | 'translate-failed'
        | 'db-failed';
    };

const inputSchema = z.object({
  reviews: z.array(reviewInputSchema),
});

type Input = z.input<typeof inputSchema>;

function hasEsText(review: ReviewInput): boolean {
  return Boolean(review.id && review.translations.es?.trim());
}

function buildItems(reviews: ReviewInput[]): ReviewTranslationItem[] {
  return reviews
    .filter(hasEsText)
    .map((r) => ({ id: r.id!, text: r.translations.es!.trim() }));
}

async function translateAll(
  items: ReviewTranslationItem[],
): Promise<Record<TranslationTarget, ReviewTranslationItem[]>> {
  const entries = await Promise.all(
    TARGET_LOCALES.map(async (locale) => {
      const result = await translateReviewsTranslations(items, locale);
      return [locale, result] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<
    TranslationTarget,
    ReviewTranslationItem[]
  >;
}

function buildI18nForReview(
  review: ReviewInput,
  byLocale: Record<TranslationTarget, ReviewTranslationItem[]>,
  serviceId: string,
): Record<string, { text: string }> {
  const i18n: Record<string, { text: string }> = {};
  // Preserve ES from the form (auto-save).
  if (review.translations.es?.trim()) {
    i18n.es = { text: review.translations.es.trim() };
  }
  for (const locale of TARGET_LOCALES) {
    const translated = byLocale[locale].find((t) => t.id === review.id);
    if (!translated) {
      // Defensive: LLM dropped this row — preserve existing target text.
      console.warn('[translate-reviews] missing translation', {
        reviewId: review.id,
        locale,
        serviceId,
      });
      if (review.translations[locale]) {
        i18n[locale] = { text: review.translations[locale] };
      }
      continue;
    }
    i18n[locale] = { text: translated.text };
  }
  return i18n;
}

export async function translateReviews(input: Input): Promise<Result> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'invalid-input' };
  }
  const { reviews } = parsed.data;

  const items = buildItems(reviews);
  if (items.length === 0) {
    return { error: 'es-incomplete' };
  }
  if (items.length > MAX_REVIEWS_WITH_ES) {
    return { error: 'too-many-reviews' };
  }

  let byLocale: Record<TranslationTarget, ReviewTranslationItem[]>;
  try {
    byLocale = await translateAll(items);
  } catch {
    return { error: 'translate-failed' };
  }

  const supabase = createClient();

  // Persist sequentially: one UPDATE per row (mirrors the editor's Save
  // loop). N+1 is acceptable for the ≤50 review cap.
  for (const review of reviews) {
    if (!review.id || !hasEsText(review)) continue;
    const i18n = buildI18nForReview(review, byLocale, review.id);
    const { error } = await supabase
      .from('reviews')
      .update({
        author_name: review.author_name,
        author_photo: review.author_photo,
        stars: review.stars,
        sort_order: review.sort_order,
        is_active: review.is_active,
        i18n: i18n as unknown as Json,
      })
      .eq('id', review.id);
    if (error) return { error: 'db-failed' };
  }

  revalidatePath('/[locale]/(admin)/admin/reviews', 'layout');
  return { data: { translatedLocales: [...TARGET_LOCALES] } };
}
