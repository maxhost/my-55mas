// Single source of truth for the review-photo storage layout. The DB
// column reviews.author_photo stores the BASE path (no extension);
// consumers build the full URL via `buildReviewPhotoPublicUrl`.
//
// Bucket: review-photos (public).
// Layout: reviews/<review_id>/avatar.webp (single 200w size).

export const REVIEW_PHOTOS_BUCKET = 'review-photos';

/** Storage path inside the bucket — used by upload + delete. */
export function reviewPhotoStoragePath(reviewId: string): string {
  return `reviews/${reviewId}/avatar.webp`;
}

/** Base path stored in reviews.author_photo (no extension). */
export function reviewPhotoBasePath(reviewId: string): string {
  return `reviews/${reviewId}/avatar`;
}

/**
 * Build the public URL for a review photo. Returns null when base is
 * empty/null or NEXT_PUBLIC_SUPABASE_URL is missing.
 */
export function buildReviewPhotoPublicUrl(
  base: string | null | undefined,
): string | null {
  if (!base) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/${REVIEW_PHOTOS_BUCKET}/${base}.webp`;
}
