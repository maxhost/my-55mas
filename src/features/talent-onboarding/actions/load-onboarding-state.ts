'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import { adaptSurveyQuestion } from '@/shared/lib/questions/survey-adapter';
import { loadAvailableServices } from '@/shared/lib/services/load-available-services';
import { tryParseJson, type I18nRecord } from '@/shared/lib/json';
import type {
  AvailableService,
  ContactAddress,
  Gender,
  OnboardingContext,
  OnboardingState,
  PersonalData,
  Payments,
  PreferredContact,
  PreferredPayment,
  ProfessionalSituation,
  ProfessionalStatus,
  SpokenLanguageOption,
  SurveyQuestion,
  SurveyResponses,
  TalentServiceEntry,
} from '../types';

type AnyJson = Record<string, unknown>;
type Supabase = ReturnType<typeof createClient>;
type ProfileRow = {
  gender: string | null;
  birth_date: string | null;
  preferred_contact: string | null;
  address: unknown;
  preferred_country: string | null;
  preferred_city: string | null;
};
type TalentProfileRow = {
  id: string;
  professional_status: string | null;
  previous_experience: string | null;
  has_social_security: boolean | null;
  preferred_payment: string | null;
  onboarding_completed_at: string | null;
  country_id: string | null;
};
type CountryRow = { id: string; code: string; i18n: I18nRecord };

export type LoadResult =
  | { ok: true; state: OnboardingState; context: OnboardingContext }
  | { ok: false; reason: 'no_session' | 'no_talent_profile' | 'no_country' };

/**
 * Single server action that loads everything the wizard needs:
 *   - Existing onboarding state (from profiles + talent_profiles + talent_services + ...)
 *   - Read-only context (country, available services, spoken_languages, survey_questions)
 */
export async function loadOnboardingState(locale: string): Promise<LoadResult> {
  const supabase = createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, reason: 'no_session' };
  const userId = auth.user.id;

  const { data: profile } = await supabase
    .from('profiles')
    .select('gender, birth_date, preferred_contact, address, preferred_country, preferred_city')
    .eq('id', userId)
    .maybeSingle();

  const { data: talentProfile } = await supabase
    .from('talent_profiles')
    .select(
      'id, professional_status, previous_experience, has_social_security, preferred_payment, onboarding_completed_at, country_id',
    )
    .eq('user_id', userId)
    .maybeSingle();
  if (!talentProfile) return { ok: false, reason: 'no_talent_profile' };

  const countryId = talentProfile.country_id ?? profile?.preferred_country ?? null;
  if (!countryId) return { ok: false, reason: 'no_country' };

  const { data: country } = await supabase
    .from('countries')
    .select('id, code, i18n')
    .eq('id', countryId)
    .single();

  const aggregates = await loadAggregates(supabase, {
    talentId: talentProfile.id,
    userId,
    countryId,
    cityId: profile?.preferred_city ?? null,
    locale,
  });

  const state = composeState({
    profile: profile as ProfileRow | null,
    talentProfile,
    talentServiceEntries: aggregates.talentServiceEntries,
    languageCodes: aggregates.languageCodes,
    surveyAnswers: aggregates.surveyAnswers,
  });

  const context = composeContext({
    talentProfile,
    profile: profile as ProfileRow | null,
    country: country as CountryRow | null,
    countryId,
    locale,
    userId,
    spokenLanguages: aggregates.spokenLanguages,
    surveyQuestions: aggregates.surveyQuestions,
    availableServices: aggregates.availableServices,
  });

  return { ok: true, state, context };
}

// ── Aggregate loader (parallel queries) ─────────────────────

async function loadAggregates(
  supabase: Supabase,
  args: {
    talentId: string;
    userId: string;
    countryId: string;
    cityId: string | null;
    locale: string;
  },
) {
  const [
    talentServiceEntries,
    languageCodes,
    surveyAnswers,
    spokenLanguages,
    surveyQuestions,
    availableServices,
  ] = await Promise.all([
    loadTalentServiceEntries(supabase, args.talentId),
    loadTalentLanguageCodes(supabase, args.talentId),
    loadSurveyAnswers(supabase, args.userId),
    loadSpokenLanguagesCatalog(supabase, args.locale),
    loadActiveSurveyQuestions(supabase),
    loadAvailableServices(supabase, args.countryId, args.cityId, args.locale),
  ]);
  return {
    talentServiceEntries,
    languageCodes,
    surveyAnswers,
    spokenLanguages,
    surveyQuestions,
    availableServices,
  };
}

// ── Compose helpers (pure transforms) ───────────────────────

function composeState(args: {
  profile: ProfileRow | null;
  talentProfile: TalentProfileRow;
  talentServiceEntries: TalentServiceEntry[];
  languageCodes: string[];
  surveyAnswers: SurveyResponses;
}): OnboardingState {
  const { profile, talentProfile, talentServiceEntries, languageCodes, surveyAnswers } = args;
  return {
    personalData: composePersonalData(profile),
    contactAddress: composeContactAddress(profile),
    professionalSituation: composeProfessionalSituation(talentProfile),
    services: { entries: talentServiceEntries },
    payments: composePayments(talentProfile),
    languages: { language_codes: languageCodes },
    survey: surveyAnswers,
    onboardingCompletedAt: talentProfile.onboarding_completed_at ?? null,
  };
}

function composePersonalData(profile: ProfileRow | null): PersonalData | null {
  if (!profile?.gender || !profile?.birth_date) return null;
  return { gender: profile.gender as Gender, birth_date: profile.birth_date };
}

function composeContactAddress(profile: ProfileRow | null): ContactAddress | null {
  if (!profile?.preferred_contact || !profile?.address) return null;
  return {
    preferred_contact: profile.preferred_contact as PreferredContact,
    address: profile.address as unknown as ContactAddress['address'],
    city_id: profile.preferred_city ?? null,
  };
}

function composeProfessionalSituation(tp: TalentProfileRow): ProfessionalSituation | null {
  if (!tp.professional_status) return null;
  return {
    professional_status: tp.professional_status as ProfessionalStatus,
    previous_experience: tp.previous_experience ?? null,
  };
}

function composePayments(tp: TalentProfileRow): Payments | null {
  if (typeof tp.has_social_security !== 'boolean' || !tp.preferred_payment) return null;
  return {
    has_social_security: tp.has_social_security,
    preferred_payment: tp.preferred_payment as PreferredPayment,
  };
}

function composeContext(args: {
  talentProfile: TalentProfileRow;
  profile: ProfileRow | null;
  country: CountryRow | null;
  countryId: string;
  locale: string;
  userId: string;
  spokenLanguages: SpokenLanguageOption[];
  surveyQuestions: SurveyQuestion[];
  availableServices: AvailableService[];
}): OnboardingContext {
  const { talentProfile, profile, country, countryId, locale, userId } = args;
  return {
    talentId: talentProfile.id,
    userId,
    countryId,
    countryCode: country?.code ?? '',
    countryName: localizedField(country?.i18n ?? null, locale, 'name') ?? country?.code ?? '',
    cityIdFromRegistration: profile?.preferred_city ?? null,
    spokenLanguages: args.spokenLanguages,
    surveyQuestions: args.surveyQuestions,
    availableServices: args.availableServices,
  };
}

// ── Per-table loaders ───────────────────────────────────────

async function loadTalentServiceEntries(
  supabase: Supabase,
  talentId: string,
): Promise<TalentServiceEntry[]> {
  const { data } = await supabase
    .from('talent_services')
    .select('service_id, unit_price, form_data')
    .eq('talent_id', talentId);
  return (data ?? []).map((row) => ({
    service_id: row.service_id,
    unit_price: typeof row.unit_price === 'number' ? row.unit_price : Number(row.unit_price ?? 0),
    override_price: false,
    answers: (row.form_data as AnyJson) ?? {},
  }));
}

async function loadTalentLanguageCodes(supabase: Supabase, talentId: string): Promise<string[]> {
  const { data } = await supabase
    .from('talent_spoken_languages')
    .select('language_code')
    .eq('talent_id', talentId);
  return (data ?? []).map((r) => r.language_code);
}

async function loadSurveyAnswers(supabase: Supabase, userId: string): Promise<SurveyResponses> {
  const { data } = await supabase
    .from('survey_responses')
    .select('key, value')
    .eq('user_id', userId);
  const answers: SurveyResponses = {};
  for (const row of data ?? []) {
    answers[row.key] = tryParseJson(row.value);
  }
  return answers;
}

async function loadSpokenLanguagesCatalog(
  supabase: Supabase,
  locale: string,
): Promise<SpokenLanguageOption[]> {
  const { data } = await supabase
    .from('spoken_languages')
    .select('code, i18n')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  return (data ?? []).map((l) => ({
    code: l.code,
    name: localizedField(l.i18n as I18nRecord, locale, 'name') ?? l.code,
  }));
}

async function loadActiveSurveyQuestions(supabase: Supabase): Promise<SurveyQuestion[]> {
  const { data } = await supabase
    .from('survey_questions')
    .select('key, response_type, options, i18n')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  return (data ?? []).map((q) =>
    adaptSurveyQuestion({
      key: q.key,
      response_type: q.response_type,
      i18n: q.i18n,
      options: q.options,
    }),
  );
}
