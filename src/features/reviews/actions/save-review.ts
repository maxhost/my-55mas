'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { saveReviewSchema } from '../schemas';
import type { SaveReviewInput } from '../types';

type SaveReviewResult =
  | { data: { id: string } }
  | { error: Record<string, string[]> };

// Upserts a review row. i18n jsonb shape is `{ <locale>: { text: '...' } }`
// — only locales with non-empty text are written.
export async function saveReview(
  input: SaveReviewInput,
): Promise<SaveReviewResult> {
  const parsed = saveReviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { review } = parsed.data;
  const supabase = createClient();

  const i18n = Object.fromEntries(
    Object.entries(review.translations).map(([locale, text]) => [
      locale,
      { text },
    ]),
  ) as unknown as Json;

  let reviewId: string;

  if (review.id) {
    const { error } = await supabase
      .from('reviews')
      .update({
        author_name: review.author_name,
        author_photo: review.author_photo,
        stars: review.stars,
        sort_order: review.sort_order,
        is_active: review.is_active,
        i18n,
      })
      .eq('id', review.id);
    if (error) return { error: { _db: [error.message] } };
    reviewId = review.id;
  } else {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        author_name: review.author_name,
        author_photo: review.author_photo,
        stars: review.stars,
        sort_order: review.sort_order,
        is_active: review.is_active,
        i18n,
      })
      .select('id')
      .single();
    if (error) return { error: { _db: [error.message] } };
    reviewId = data.id;
  }

  revalidatePath('/[locale]/(admin)/admin/reviews', 'layout');
  return { data: { id: reviewId } };
}
