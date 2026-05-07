'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { savePersonalDataSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

/**
 * Updates `profiles.full_name` + `profiles.phone` (per-user data) and
 * `client_profiles.is_business` + `client_profiles.company_name` (per-role
 * data). Wraps both writes; if the second fails the first is NOT rolled back
 * (Supabase JS doesn't expose transactions outside RPCs). Practically these
 * two columns are local enough that partial-success risk is low; if it
 * becomes an issue, move to a SQL function.
 */
export async function saveClientPersonalData(input: unknown): Promise<Result> {
  const supabase = createClient();

  const parsed = savePersonalDataSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { clientId, full_name, is_business, company_name, phone } = parsed.data;

  const { data: cp, error: cpErr } = await supabase
    .from('client_profiles')
    .select('user_id')
    .eq('id', clientId)
    .maybeSingle();
  if (cpErr) return { error: { message: cpErr.message } };
  if (!cp) return { error: { message: 'Client not found' } };

  const { error: profErr } = await supabase
    .from('profiles')
    .update({ full_name, phone })
    .eq('id', cp.user_id);
  if (profErr) return { error: { message: profErr.message } };

  const { error: clientErr } = await supabase
    .from('client_profiles')
    .update({
      is_business,
      // Clear company_name when toggling away from business so we don't keep
      // stale data on a particular client.
      company_name: is_business ? company_name : null,
    })
    .eq('id', clientId);
  if (clientErr) return { error: { message: clientErr.message } };

  revalidatePath('/[locale]/(admin)/admin/clients/[id]', 'page');
  return { data: { ok: true } };
}
