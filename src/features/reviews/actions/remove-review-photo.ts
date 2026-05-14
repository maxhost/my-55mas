'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  REVIEW_PHOTOS_BUCKET,
  reviewPhotoStoragePath,
} from '@/shared/lib/reviews/photo-storage';

const inputSchema = z.object({ reviewId: z.string().uuid() });

type Result = { data: { ok: true } } | { error: { message: string } };

export async function removeReviewPhoto(input: {
  reviewId: string;
}): Promise<Result> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: {
        message: parsed.error.issues[0]?.message ?? 'Invalid reviewId',
      },
    };
  }
  const { reviewId } = parsed.data;

  const admin = createAdminClient();

  // Best-effort storage delete (don't error if file is already gone).
  await admin.storage
    .from(REVIEW_PHOTOS_BUCKET)
    .remove([reviewPhotoStoragePath(reviewId)]);

  const { error } = await admin
    .from('reviews')
    .update({ author_photo: null })
    .eq('id', reviewId);
  if (error) return { error: { message: `DB update failed: ${error.message}` } };

  revalidatePath('/[locale]/(admin)/admin/reviews', 'layout');
  return { data: { ok: true } };
}
