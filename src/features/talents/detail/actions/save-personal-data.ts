'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { savePersonalDataSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

export async function saveTalentPersonalData(input: unknown): Promise<Result> {
  const supabase = createClient();

  const parsed = savePersonalDataSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { talentId, full_name, gender, birth_date } = parsed.data;

  const { data: tp, error: tpErr } = await supabase
    .from('talent_profiles')
    .select('user_id')
    .eq('id', talentId)
    .maybeSingle();
  if (tpErr) return { error: { message: tpErr.message } };
  if (!tp) return { error: { message: 'Talent not found' } };

  const { error } = await supabase
    .from('profiles')
    .update({ full_name, gender, birth_date })
    .eq('id', tp.user_id);
  if (error) return { error: { message: error.message } };

  revalidatePath('/[locale]/(admin)/admin/talents/[id]', 'page');
  return { data: { ok: true } };
}
