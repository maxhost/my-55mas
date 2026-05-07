'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { saveContactSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

/**
 * Updates `profiles.email`, `profiles.address`, `profiles.preferred_country`,
 * `profiles.preferred_city`. Email is included in the schema for symmetry
 * but the UI keeps the input read-only (changing it without rotating
 * auth.users.email would desync auth from app data — that's a separate flow).
 *
 * The address is normalized to null on the client when all fields are
 * empty; we trust that here and persist the JSON as-is.
 */
export async function saveClientContact(input: unknown): Promise<Result> {
  const supabase = createClient();

  const parsed = saveContactSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { clientId, email, address, preferred_country, preferred_city } = parsed.data;

  const { data: cp, error: cpErr } = await supabase
    .from('client_profiles')
    .select('user_id')
    .eq('id', clientId)
    .maybeSingle();
  if (cpErr) return { error: { message: cpErr.message } };
  if (!cp) return { error: { message: 'Client not found' } };

  const { error } = await supabase
    .from('profiles')
    .update({
      email,
      address: (address as unknown as Json) ?? null,
      preferred_country,
      preferred_city,
    })
    .eq('id', cp.user_id);
  if (error) return { error: { message: error.message } };

  revalidatePath('/[locale]/(admin)/admin/clients/[id]', 'page');
  return { data: { ok: true } };
}
