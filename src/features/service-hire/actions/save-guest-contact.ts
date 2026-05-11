'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { guestContactSchema } from '../schemas';
import { validateFiscalId, normalizeFiscalId } from '@/shared/fiscal/validators';

type Result = { data: { userId: string } } | { error: { message: string } };

/**
 * Persists guest contact + fiscal data after anonymous sign-in. Writes to
 * - profiles: full_name, phone, email (so order INSERT picks them up)
 * - client_profiles: fiscal_id_type_id, fiscal_id (upsert by user_id)
 *
 * Rejects if:
 *  - Not authenticated (caller must have already done signinAsGuest).
 *  - Caller is NOT an anonymous user (a registered user has no reason to
 *    call this — they have their data on the profile already).
 *  - Email is already registered to another (non-anonymous) account (B1
 *    decision: block guest re-use of an account email).
 *  - Fiscal id fails format validation for the resolved code.
 */
export async function saveGuestContact(input: unknown): Promise<Result> {
  const parsed = guestContactSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const data = parsed.data;

  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { error: { message: 'Not authenticated' } };
  }
  if (!authData.user.is_anonymous) {
    return { error: { message: 'Only guest sessions may call this action' } };
  }
  const userId = authData.user.id;

  // Server-side email-conflict guard (defense-in-depth; UI also blocks).
  const { data: existsBool, error: rpcErr } = await supabase.rpc('is_email_registered', {
    p_email: data.email,
  });
  if (rpcErr) {
    return { error: { message: rpcErr.message } };
  }
  if (existsBool === true) {
    return { error: { message: 'email_already_registered' } };
  }

  // Validate fiscal id against its type's regex (resolve code from DB).
  const { data: fiscalType, error: ftErr } = await supabase
    .from('fiscal_id_types')
    .select('code, is_active')
    .eq('id', data.fiscal_id_type_id)
    .maybeSingle();
  if (ftErr) return { error: { message: ftErr.message } };
  if (!fiscalType || !fiscalType.is_active) {
    return { error: { message: 'invalid_fiscal_id_type' } };
  }
  const fiscalRes = validateFiscalId(data.fiscal_id, fiscalType.code);
  if (!fiscalRes.ok) {
    return { error: { message: `fiscal_id_${fiscalRes.reason}` } };
  }
  const normalizedFiscalId = normalizeFiscalId(data.fiscal_id);

  const admin = createAdminClient();

  // 1) profiles update — full_name, phone, email. active_role left untouched
  //    (anonymous users do not have a role assigned yet; signup converts).
  const { error: profErr } = await admin
    .from('profiles')
    .update({
      full_name: data.full_name,
      phone: data.phone,
      email: data.email,
    })
    .eq('id', userId);
  if (profErr) return { error: { message: profErr.message } };

  // 2) client_profiles upsert — fiscal_id_type_id + fiscal_id. user_id is UNIQUE.
  //    terms_accepted is set by submit-service-hire, not here.
  const { error: cpErr } = await admin
    .from('client_profiles')
    .upsert(
      {
        user_id: userId,
        fiscal_id_type_id: data.fiscal_id_type_id,
        fiscal_id: normalizedFiscalId,
      },
      { onConflict: 'user_id' },
    );
  if (cpErr) return { error: { message: cpErr.message } };

  return { data: { userId } };
}
