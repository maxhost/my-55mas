'use server';

import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { Database, Json } from '@/lib/supabase/database.types';
import { TalentRegistrationSchema, type TalentRegistrationSchemaOutput } from '../schemas';

type RegisterError = { error: Record<string, string[]> };
type RegisterOk = { ok: true };

type Client = SupabaseClient<Database>;

export async function registerTalent(
  input: unknown,
  locale: string,
): Promise<RegisterError | void> {
  const parsed = TalentRegistrationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = createClient();
  const data = parsed.data;

  const userResult = await createAuthUser(supabase, data);
  if ('error' in userResult) return userResult;
  const userId = userResult.userId;

  const profileError = await populateProfile(supabase, userId, data, locale);
  if (profileError) return profileError;

  const talentResult = await createTalentProfile(supabase, userId, data);
  if ('error' in talentResult) return talentResult;
  const talentProfileId = talentResult.talentProfileId;

  const servicesError = await createTalentServices(
    supabase,
    talentProfileId,
    data.services,
    data.country_id,
  );
  if (servicesError) return servicesError;

  await sendConfirmationEmail(supabase, data.email);

  redirect(`/${locale}/portal/onboarding`);
}

async function createAuthUser(
  supabase: Client,
  data: TalentRegistrationSchemaOutput,
): Promise<{ userId: string } | RegisterError> {
  const { data: result, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: { data: { full_name: data.full_name } },
  });
  if (error) {
    if (/already/i.test(error.message)) {
      return { error: { email: ['duplicateEmail'] } };
    }
    return { error: { _auth: [error.message] } };
  }
  if (!result.user) return { error: { _auth: ['no_user'] } };
  return { userId: result.user.id };
}

async function populateProfile(
  supabase: Client,
  userId: string,
  data: TalentRegistrationSchemaOutput,
  locale: string,
): Promise<RegisterError | null> {
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.full_name,
      phone: data.phone,
      address: data.address as unknown as Json,
      preferred_country: data.country_id,
      preferred_city: data.city_id,
      preferred_locale: locale,
      active_role: 'talent',
    })
    .eq('id', userId);
  if (error) return { error: { _profile: [error.message] } };
  return null;
}

async function createTalentProfile(
  supabase: Client,
  userId: string,
  data: TalentRegistrationSchemaOutput,
): Promise<{ talentProfileId: string } | RegisterError> {
  const { data: row, error } = await supabase
    .from('talent_profiles')
    .insert({
      user_id: userId,
      status: 'pending',
      country_id: data.country_id,
      city_id: data.city_id,
      fiscal_id_type_id: data.fiscal_id_type_id,
      fiscal_id: data.fiscal_id,
      terms_accepted: data.terms_accepted,
      marketing_consent: data.marketing_consent,
      additional_info: data.additional_info ?? null,
    })
    .select('id')
    .single();
  if (error || !row) return { error: { _talent: [error?.message ?? 'failed'] } };
  return { talentProfileId: row.id };
}

async function createTalentServices(
  supabase: Client,
  talentProfileId: string,
  serviceIds: string[],
  countryId: string,
): Promise<RegisterError | null> {
  const rows = serviceIds.map((service_id) => ({
    talent_id: talentProfileId,
    service_id,
    country_id: countryId,
    is_verified: false,
  }));
  const { error } = await supabase.from('talent_services').insert(rows);
  if (error) return { error: { _services: [error.message] } };
  return null;
}

async function sendConfirmationEmail(supabase: Client, email: string): Promise<void> {
  // Best-effort. If it fails, registration still succeeds.
  await supabase.auth.resend({ type: 'signup', email }).catch(() => undefined);
}
