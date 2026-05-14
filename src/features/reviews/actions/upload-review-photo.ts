'use server';

import sharp from 'sharp';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  REVIEW_PHOTOS_BUCKET,
  reviewPhotoBasePath,
  reviewPhotoStoragePath,
} from '@/shared/lib/reviews/photo-storage';

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB
const PHOTO_WIDTH = 200;
const ACCEPTED_INPUT_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
]);

const inputSchema = z.object({ reviewId: z.string().uuid() });

type Result =
  | { data: { photoBase: string } }
  | { error: { message: string } };

// Resizes the uploaded image to a 200w WebP and stores it in the
// review-photos bucket. Updates reviews.author_photo with the base path
// so consumers can append `.webp` for the public URL.
export async function uploadReviewPhoto(formData: FormData): Promise<Result> {
  const rawId = formData.get('reviewId');
  const file = formData.get('file');

  const parsed = inputSchema.safeParse({ reviewId: rawId });
  if (!parsed.success) {
    return {
      error: {
        message: parsed.error.issues[0]?.message ?? 'Invalid reviewId',
      },
    };
  }
  const { reviewId } = parsed.data;

  if (!(file instanceof File)) {
    return { error: { message: 'No file' } };
  }
  if (file.size === 0) {
    return { error: { message: 'Empty file' } };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      error: {
        message: `File too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB)`,
      },
    };
  }
  if (!ACCEPTED_INPUT_MIME.has(file.type)) {
    return { error: { message: `Unsupported MIME ${file.type}` } };
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return { error: { message: 'Could not read file' } };
  }

  let webp: Buffer;
  try {
    webp = await sharp(buffer)
      .rotate()
      .resize({ width: PHOTO_WIDTH, withoutEnlargement: true })
      .webp({ quality: 85, effort: 5 })
      .toBuffer();
  } catch (err) {
    return {
      error: { message: `Image processing failed: ${(err as Error).message}` },
    };
  }

  const admin = createAdminClient();
  const path = reviewPhotoStoragePath(reviewId);
  const { error: uploadErr } = await admin.storage
    .from(REVIEW_PHOTOS_BUCKET)
    .upload(path, webp, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: true,
    });
  if (uploadErr) {
    return { error: { message: `Upload failed: ${uploadErr.message}` } };
  }

  const base = reviewPhotoBasePath(reviewId);
  const { error: dbErr } = await admin
    .from('reviews')
    .update({ author_photo: base })
    .eq('id', reviewId);
  if (dbErr) {
    return { error: { message: `DB update failed: ${dbErr.message}` } };
  }

  revalidatePath('/[locale]/(admin)/admin/reviews', 'layout');
  return { data: { photoBase: base } };
}
