'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { saveProfessionalSituationSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

export async function saveTalentProfessionalSituation(input: unknown): Promise<Result> {
  const supabase = createClient();

  const parsed = saveProfessionalSituationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { talentId, professional_status, previous_experience } = parsed.data;

  const { error } = await supabase
    .from('talent_profiles')
    .update({ professional_status, previous_experience })
    .eq('id', talentId);
  if (error) return { error: { message: error.message } };

  revalidatePath('/[locale]/(admin)/admin/talents/[id]', 'page');
  return { data: { ok: true } };
}
