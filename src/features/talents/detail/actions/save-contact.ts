'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { saveContactSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

export async function saveTalentContact(input: unknown): Promise<Result> {
  const supabase = createClient();

  const parsed = saveContactSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { talentId, email, phone, preferred_contact, address, preferred_country, preferred_city } =
    parsed.data;

  const { data: tp, error: tpErr } = await supabase
    .from('talent_profiles')
    .select('user_id')
    .eq('id', talentId)
    .maybeSingle();
  if (tpErr) return { error: { message: tpErr.message } };
  if (!tp) return { error: { message: 'Talent not found' } };

  const { error: profErr } = await supabase
    .from('profiles')
    .update({
      email,
      phone,
      preferred_contact,
      address: (address as unknown as Json) ?? null,
      preferred_country,
      preferred_city,
    })
    .eq('id', tp.user_id);
  if (profErr) return { error: { message: profErr.message } };

  // Mirror country/city to talent_profiles too so the talent_profiles_check
  // constraint (which requires country_id+city_id for non-registered/excluded
  // statuses) stays satisfied. Admin sees a single "país/ciudad" UI; we keep
  // both layers in sync on save.
  const { error: tpUpdErr } = await supabase
    .from('talent_profiles')
    .update({
      country_id: preferred_country,
      city_id: preferred_city,
    })
    .eq('id', talentId);
  if (tpUpdErr) return { error: { message: tpUpdErr.message } };

  revalidatePath('/[locale]/(admin)/admin/talents/[id]', 'page');
  return { data: { ok: true } };
}
