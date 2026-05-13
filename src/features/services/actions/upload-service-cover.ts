'use server';

import sharp from 'sharp';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  COVER_MAX_WIDTH,
  COVER_SIZES,
  SERVICE_IMAGES_BUCKET,
  coverBasePath,
  coverStoragePath,
  type CoverSize,
} from '../lib/cover-image-storage';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB raw upload limit
const ACCEPTED_INPUT_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
]);

const inputSchema = z.object({
  serviceId: z.string().uuid(),
});

type Result =
  | { data: { coverBase: string } }
  | { error: { message: string } };

/**
 * Optimises the uploaded image with sharp (WebP quality 85, multiple
 * widths) and stores each variant in the service-images bucket. On
 * success, updates services.cover_image_url with the base path so
 * downstream renders can append the size suffix.
 *
 * Auth: relies on the admin layer guarding /admin/* routes; this action
 * uses the service-role client so it can write to a bucket with auth-
 * only INSERT policies.
 */
export async function uploadServiceCover(formData: FormData): Promise<Result> {
  const rawServiceId = formData.get('serviceId');
  const file = formData.get('file');

  const parsed = inputSchema.safeParse({ serviceId: rawServiceId });
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid serviceId' } };
  }
  const { serviceId } = parsed.data;

  if (!(file instanceof File)) {
    return { error: { message: 'No file' } };
  }
  if (file.size === 0) {
    return { error: { message: 'Empty file' } };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: { message: `File too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB)` } };
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

  // Build all 3 variants in parallel. Sharp keeps aspect ratio by default
  // when only width is provided; we cap width so portrait shots get a
  // tall WebP and landscape shots get a wide one.
  const variants: Array<{ size: CoverSize; data: Buffer }> = [];
  try {
    await Promise.all(
      COVER_SIZES.map(async (size) => {
        const out = await sharp(buffer)
          .rotate() // honor EXIF orientation
          .resize({ width: COVER_MAX_WIDTH[size], withoutEnlargement: true })
          .webp({ quality: 85, effort: 5 })
          .toBuffer();
        variants.push({ size, data: out });
      }),
    );
  } catch (err) {
    return { error: { message: `Image processing failed: ${(err as Error).message}` } };
  }

  const admin = createAdminClient();
  const storage = admin.storage.from(SERVICE_IMAGES_BUCKET);

  // Upload each variant with upsert so re-uploading the same service
  // replaces the previous cover atomically.
  for (const v of variants) {
    const path = coverStoragePath(serviceId, v.size);
    const { error } = await storage.upload(path, v.data, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: true,
    });
    if (error) {
      return { error: { message: `Upload (${v.size}) failed: ${error.message}` } };
    }
  }

  const base = coverBasePath(serviceId);
  const { error: dbError } = await admin
    .from('services')
    .update({ cover_image_url: base })
    .eq('id', serviceId);
  if (dbError) {
    return { error: { message: `DB update failed: ${dbError.message}` } };
  }

  revalidatePath(`/[locale]/admin/services/${serviceId}`, 'page');
  revalidatePath('/[locale]/admin/services', 'page');
  return { data: { coverBase: base } };
}
