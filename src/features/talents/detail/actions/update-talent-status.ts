'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { updateTalentStatusSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

/**
 * Updates `talent_profiles.status`. Also writes a system entry to
 * `talent_notes` so the timeline reflects who changed what and why.
 *
 * The status-change template is rendered client-side (i18n lives in hints);
 * here we just persist the structured fact via a minimal English-ish body.
 * Phase F could move templating to a DB function if needed.
 */
export async function updateTalentStatus(input: unknown): Promise<Result> {
  const supabase = createClient();

  const parsed = updateTalentStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { talentId, status, reason } = parsed.data;

  const { data: existing, error: fetchErr } = await supabase
    .from('talent_profiles')
    .select('status')
    .eq('id', talentId)
    .maybeSingle();
  if (fetchErr) return { error: { message: fetchErr.message } };
  if (!existing) return { error: { message: 'Talent not found' } };

  if (existing.status === status) {
    return { data: { ok: true } };
  }

  const { error: updateErr } = await supabase
    .from('talent_profiles')
    .update({ status })
    .eq('id', talentId);
  if (updateErr) return { error: { message: updateErr.message } };

  const { data: auth } = await supabase.auth.getUser();
  const body = reason
    ? `Status: ${existing.status} → ${status}. Reason: ${reason}`
    : `Status: ${existing.status} → ${status}`;
  await supabase.from('talent_notes').insert({
    talent_id: talentId,
    body,
    is_system: true,
    author_id: auth.user?.id ?? null,
  });

  revalidatePath('/[locale]/(admin)/admin/talents/[id]', 'page');
  return { data: { ok: true } };
}
