'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { deleteClientSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

/**
 * Soft-deletes a client by invoking the `public.delete_client(uuid)` RPC,
 * which atomically:
 *   1. Sets `client_profiles.deleted_at = now()`.
 *   2. Sets `auth.users.banned_until = '2099-01-01'` so the user cannot
 *      log in again.
 *
 * The RPC runs as SECURITY DEFINER so we don't need service-role at the
 * runtime. Idempotent: calling on an already-deleted client returns no rows
 * (no error). Historical orders / payments stay intact (FKs to profiles
 * remain valid).
 *
 * The UI also requires the admin to type the client's full name as
 * client-side confirmation; the value reaches us via `confirmName` and we
 * verify it server-side against the live profile to prevent CSRF /
 * URL-trigger style mistakes.
 */
export async function deleteClient(input: unknown): Promise<Result> {
  const supabase = createClient();

  const parsed = deleteClientSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { clientId, confirmName } = parsed.data;

  // Cross-check the typed name server-side — the UI already enforces this,
  // but defense-in-depth: if anyone hits the action programmatically, the
  // confirmName must still match.
  const { data: cp, error: cpErr } = await supabase
    .from('client_profiles')
    .select('user_id, deleted_at, profiles!inner(full_name)')
    .eq('id', clientId)
    .maybeSingle();
  if (cpErr) return { error: { message: cpErr.message } };
  if (!cp) return { error: { message: 'Client not found' } };
  if (cp.deleted_at !== null) return { data: { ok: true } }; // already deleted, idempotent

  const profile = cp.profiles as unknown as { full_name: string | null };
  const expected = (profile?.full_name ?? '').trim();
  if (!expected || expected !== confirmName.trim()) {
    return { error: { message: 'Confirmation name does not match' } };
  }

  const { error: rpcErr } = await supabase.rpc('delete_client', { p_client_id: clientId });
  if (rpcErr) return { error: { message: rpcErr.message } };

  revalidatePath('/[locale]/(admin)/admin/clients', 'page');
  revalidatePath('/[locale]/(admin)/admin/clients/[id]', 'page');
  return { data: { ok: true } };
}
