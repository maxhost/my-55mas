'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  REVIEW_PHOTOS_BUCKET,
  reviewPhotoStoragePath,
} from '@/shared/lib/reviews/photo-storage';

type DeleteReviewResult =
  | { data: { id: string } }
  | { error: Record<string, string[]> };

// Hard delete: removes the review row AND its avatar in storage (if any).
// Reviews are testimonials — historical preservation isn't needed beyond
// what the soft-delete of services provides for orders. Admins can hide
// without deleting via the `is_active` flag.
export async function deleteReview(id: string): Promise<DeleteReviewResult> {
  if (!id) return { error: { id: ['id is required'] } };

  const admin = createAdminClient();

  // Read author_photo first to know if there's storage to clean up.
  const { data: row, error: readError } = await admin
    .from('reviews')
    .select('author_photo')
    .eq('id', id)
    .single();
  if (readError) return { error: { _db: [readError.message] } };

  // Best-effort storage cleanup. If it fails, we still delete the row
  // (orphaned avatar is acceptable; trying to roll back the DB later is
  // worse).
  if (row?.author_photo) {
    await admin.storage
      .from(REVIEW_PHOTOS_BUCKET)
      .remove([reviewPhotoStoragePath(id)]);
  }

  const { error } = await admin.from('reviews').delete().eq('id', id);
  if (error) return { error: { _db: [error.message] } };

  revalidatePath('/[locale]/(admin)/admin/reviews', 'layout');
  return { data: { id } };
}
