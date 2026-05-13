'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  COVER_SIZES,
  SERVICE_IMAGES_BUCKET,
  coverStoragePath,
} from '../lib/cover-image-storage';

const inputSchema = z.object({ serviceId: z.string().uuid() });

type Result = { data: { ok: true } } | { error: { message: string } };

export async function removeServiceCover(input: unknown): Promise<Result> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { serviceId } = parsed.data;

  const admin = createAdminClient();
  const storage = admin.storage.from(SERVICE_IMAGES_BUCKET);

  // Best-effort delete of all variants. We don't fail the whole action
  // if a variant is missing — the goal is "no more cover" and a stale
  // file is harmless because the DB no longer points at it.
  const paths = COVER_SIZES.map((s) => coverStoragePath(serviceId, s));
  await storage.remove(paths).catch(() => undefined);

  const { error: dbError } = await admin
    .from('services')
    .update({ cover_image_url: null })
    .eq('id', serviceId);
  if (dbError) {
    return { error: { message: `DB update failed: ${dbError.message}` } };
  }

  revalidatePath(`/[locale]/admin/services/${serviceId}`, 'page');
  revalidatePath('/[locale]/admin/services', 'page');
  return { data: { ok: true } };
}
