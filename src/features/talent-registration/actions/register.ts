'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/database.types';
import { TalentRegistrationSchema, type TalentRegistrationSchemaOutput } from '../schemas';
import { getServicesByLocation } from './get-services-by-location';

export type RegisterErrorCode =
  | 'invalid'
  | 'invalid_location'
  | 'invalid_fiscal_type'
  | 'invalid_services'
  | 'invalid_locale'
  | 'duplicate_email'
  | 'weak_password'
  | 'try_later'
  | 'unexpected';

export type RegisterResult =
  | {
      error: {
        code: RegisterErrorCode;
        fieldErrors?: Record<string, string[]>;
      };
    }
  | void;

export async function registerTalent(
  input: unknown,
  locale: string,
): Promise<RegisterResult> {
  const parsed = TalentRegistrationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: {
        code: 'invalid',
        fieldErrors: parsed.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      },
    };
  }
  const data = parsed.data;

  // Referential validation BEFORE signUp (anon client; public
  // catalogs, RLS off) so an invalid payload never creates an orphan
  // auth user. The RPC re-validates as the authoritative source.
  const refError = await validateReferences(data, locale);
  if (refError) return { error: { code: refError } };

  // signUp (anon + SSR cookies). Keep the session to decide the
  // post-success navigation (autoconfirm → session; confirm-on →
  // null). No `role` in metadata (handle_new_user is hardened to
  // always seed 'client'; talent is granted only by the RPC).
  const supabase = createClient();
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: { data: { full_name: data.full_name } },
  });
  if (signUpError) {
    return { error: { code: mapSignUpError(signUpError.message) } };
  }
  const userId = signUpData.user?.id;
  if (!userId) return { error: { code: 'unexpected' } };

  // Atomic post-signUp work via the service-role-only RPC. The
  // try/catch wraps ONLY the RPC (never the redirect).
  const admin = createAdminClient();
  let rpcOk = false;
  let rpcCode: RegisterErrorCode | null = null;
  try {
    const { data: rpcData, error: rpcError } = await admin.rpc(
      'register_talent_profile',
      {
        p_user_id: userId,
        p_phone: data.phone,
        p_address: data.address as unknown as Json,
        p_country_id: data.country_id,
        p_city_id: data.city_id,
        p_fiscal_id_type_id: data.fiscal_id_type_id,
        p_fiscal_id: data.fiscal_id,
        p_additional_info: data.additional_info ?? '',
        p_terms_accepted: data.terms_accepted,
        p_marketing_consent: data.marketing_consent,
        p_preferred_locale: locale,
        p_service_ids: data.services,
      },
    );
    if (rpcError) throw rpcError;
    const res = rpcData as { ok: boolean; code?: string };
    rpcOk = res?.ok === true;
    if (!rpcOk) rpcCode = (res?.code as RegisterErrorCode) ?? 'unexpected';
  } catch (e) {
    console.error('[registerTalent] rpc failed', e);
    rpcCode = 'unexpected';
  }

  if (!rpcOk) {
    // Saga compensation, idempotent: only delete the just-created
    // auth user if the talent profile truly does not exist (a lost
    // response could mean the RPC actually committed).
    const { data: existing } = await admin
      .from('talent_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (existing) {
      rpcOk = true; // it had completed; treat as success
    } else {
      await admin.auth.admin
        .deleteUser(userId)
        .catch((e) => console.error('[registerTalent] compensate failed', e));
      return { error: { code: rpcCode ?? 'unexpected' } };
    }
  }

  // Best-effort confirmation email (only relevant when confirm-on).
  await supabase.auth
    .resend({ type: 'signup', email: data.email })
    .catch(() => undefined);

  // Post-success navigation (deterministic, session-aware).
  // redirect() throws NEXT_REDIRECT — intentionally OUTSIDE any
  // try/catch.
  if (signUpData.session) {
    redirect(`/${locale}/portal/onboarding`);
  }
  redirect(`/${locale}/login?registered=talent`);
}

async function validateReferences(
  data: TalentRegistrationSchemaOutput,
  locale: string,
): Promise<Exclude<RegisterErrorCode, 'invalid' | 'duplicate_email' | 'weak_password' | 'try_later' | 'unexpected'> | null> {
  const supabase = createClient();

  const [{ data: country }, { data: city }, { data: fiscal }, { data: lang }] =
    await Promise.all([
      supabase
        .from('countries')
        .select('id')
        .eq('id', data.country_id)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('cities')
        .select('id')
        .eq('id', data.city_id)
        .eq('country_id', data.country_id)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('fiscal_id_types')
        .select('id')
        .eq('id', data.fiscal_id_type_id)
        .maybeSingle(),
      supabase
        .from('languages')
        .select('code')
        .eq('code', locale)
        .maybeSingle(),
    ]);

  if (!country || !city) return 'invalid_location';
  if (!fiscal) return 'invalid_fiscal_type';
  if (!lang) return 'invalid_locale';

  const allowed = await getServicesByLocation(
    data.country_id,
    data.city_id,
    locale,
  );
  const allowedIds = new Set(allowed.map((s) => s.id));
  if (!data.services.every((id) => allowedIds.has(id))) {
    return 'invalid_services';
  }
  return null;
}

function mapSignUpError(message: string): RegisterErrorCode {
  if (/already|registered/i.test(message)) return 'duplicate_email';
  if (/password/i.test(message)) return 'weak_password';
  if (/rate|429|too many/i.test(message)) return 'try_later';
  return 'unexpected';
}
