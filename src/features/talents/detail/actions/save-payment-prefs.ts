'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { savePaymentPrefsSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

export async function saveTalentPaymentPrefs(input: unknown): Promise<Result> {
  const supabase = createClient();

  const parsed = savePaymentPrefsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { talentId, preferred_payment, has_social_security, fiscal_id_type_id, fiscal_id } =
    parsed.data;

  const { error } = await supabase
    .from('talent_profiles')
    .update({ preferred_payment, has_social_security, fiscal_id_type_id, fiscal_id })
    .eq('id', talentId);
  if (error) return { error: { message: error.message } };

  revalidatePath('/[locale]/(admin)/admin/talents/[id]', 'page');
  return { data: { ok: true } };
}
