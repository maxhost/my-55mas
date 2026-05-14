import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import { buildReviewPhotoPublicUrl } from '@/shared/lib/reviews/photo-storage';
import type { I18nRecord } from '@/shared/lib/json';

export type HomeReviewCard = {
  id: string;
  authorName: string;
  photoUrl: string | null;
  rating: number;
  quote: string;
};

// Graceful degradation: reviews are decorative marketing content. If the
// DB fetch fails (transient outage, network glitch), the home should keep
// rendering — we log the failure and return [] so HomeTestimonials hides
// the section. This diverges intentionally from `loadHomeServices` which
// throws (services are core content; their absence should be loud).
export async function loadHomeReviews(
  locale: string,
): Promise<HomeReviewCard[]> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('reviews')
      .select(
        'id, author_name, author_photo, stars, sort_order, i18n, created_at',
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[loadHomeReviews] db error', {
        message: error.message,
      });
      return [];
    }

    const result: HomeReviewCard[] = [];
    for (const row of data ?? []) {
      const i18n = row.i18n as unknown as I18nRecord;
      const quote = localizedField(i18n, locale, 'text');
      if (!quote || !quote.trim()) continue;
      result.push({
        id: row.id,
        authorName: row.author_name,
        photoUrl: buildReviewPhotoPublicUrl(row.author_photo),
        rating: Number(row.stars),
        quote,
      });
    }
    return result;
  } catch (err) {
    console.error('[loadHomeReviews] unexpected throw', {
      message: (err as Error)?.message,
    });
    return [];
  }
}
