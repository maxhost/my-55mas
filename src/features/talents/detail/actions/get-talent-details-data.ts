'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import { adaptSurveyQuestion } from '@/shared/lib/questions/survey-adapter';
import { loadAvailableServices } from '@/shared/lib/services/load-available-services';
import { tryParseJson, type I18nRecord } from '@/shared/lib/json';
import type { AddressValue } from '@/shared/components/address-autocomplete';
import type { Question } from '@/shared/lib/questions/types';
import type {
  CityRef,
  CountryRef,
  FiscalIdTypeRef,
  SpokenLanguageOption,
  TalentDetailContext,
  TalentDetailsData,
  TalentServiceRow,
} from '../types';

type Result = {
  data: TalentDetailsData;
  context: TalentDetailContext;
};

export async function getTalentDetailsData(
  talentId: string,
  locale: string,
): Promise<Result | null> {
  const supabase = createClient();

  const { data: tp } = await supabase
    .from('talent_profiles')
    .select(
      'id, user_id, country_id, city_id, professional_status, previous_experience, has_social_security, preferred_payment, fiscal_id_type_id, fiscal_id',
    )
    .eq('id', talentId)
    .maybeSingle();
  if (!tp) return null;

  const [
    profileRes,
    talentServicesRes,
    languageCodesRes,
    surveyAnswersRes,
    countriesRes,
    citiesRes,
    spokenLanguagesRes,
    surveyQuestionsRes,
    fiscalTypesRes,
    availableServices,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'full_name, gender, birth_date, email, phone, preferred_contact, address, preferred_country, preferred_city',
      )
      .eq('id', tp.user_id)
      .maybeSingle(),
    supabase
      .from('talent_services')
      .select('service_id, country_id, unit_price, form_data')
      .eq('talent_id', talentId),
    supabase.from('talent_spoken_languages').select('language_code').eq('talent_id', talentId),
    supabase.from('survey_responses').select('key, value').eq('user_id', tp.user_id),
    supabase.from('countries').select('id, code, i18n').eq('is_active', true),
    tp.country_id
      ? supabase.from('cities').select('id, country_id, i18n').eq('country_id', tp.country_id)
      : Promise.resolve({ data: [] }),
    supabase
      .from('spoken_languages')
      .select('code, i18n')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('survey_questions')
      .select('key, response_type, options, i18n')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('fiscal_id_types')
      .select('id, code, i18n')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    tp.country_id
      ? loadAvailableServices(supabase, tp.country_id, tp.city_id ?? null, locale)
      : Promise.resolve([]),
  ]);

  const profile = profileRes.data;
  const serviceIds = Array.from(new Set((talentServicesRes.data ?? []).map((r) => r.service_id)));
  const { data: serviceCatalog } = serviceIds.length > 0
    ? await supabase.from('services').select('id, slug, i18n').in('id', serviceIds)
    : { data: [] };
  const serviceNameMap = new Map<string, string>(
    (serviceCatalog ?? []).map((s) => [
      s.id,
      localizedField(s.i18n as I18nRecord, locale, 'name') ?? s.slug,
    ]),
  );

  const countries: CountryRef[] = (countriesRes.data ?? []).map((c) => ({
    id: c.id,
    code: c.code,
    name: localizedField(c.i18n as I18nRecord, locale, 'name') ?? c.code,
  }));
  const countryNameMap = new Map(countries.map((c) => [c.id, c.name]));

  const cities: CityRef[] = (citiesRes.data ?? []).map((c) => ({
    id: c.id,
    country_id: c.country_id,
    name: localizedField(c.i18n as I18nRecord, locale, 'name') ?? '',
  }));

  const services: TalentServiceRow[] = (talentServicesRes.data ?? []).map((r) => ({
    service_id: r.service_id,
    service_name: serviceNameMap.get(r.service_id) ?? null,
    country_id: r.country_id,
    country_name: countryNameMap.get(r.country_id) ?? null,
    unit_price: typeof r.unit_price === 'number' ? r.unit_price : Number(r.unit_price ?? 0),
    answers: ((r.form_data as unknown) as Record<string, unknown>) ?? {},
  }));

  const survey: Record<string, unknown> = {};
  for (const row of surveyAnswersRes.data ?? []) {
    survey[row.key] = tryParseJson(row.value);
  }

  const spokenLanguages: SpokenLanguageOption[] = (spokenLanguagesRes.data ?? []).map((l) => ({
    code: l.code,
    name: localizedField(l.i18n as I18nRecord, locale, 'name') ?? l.code,
  }));

  const surveyQuestions: Question[] = (surveyQuestionsRes.data ?? []).map((q) =>
    adaptSurveyQuestion({
      key: q.key,
      response_type: q.response_type,
      i18n: q.i18n,
      options: q.options,
    }),
  );

  const fiscalIdTypes: FiscalIdTypeRef[] = (fiscalTypesRes.data ?? []).map((t) => ({
    id: t.id,
    code: t.code,
    label: localizedField(t.i18n as I18nRecord, locale, 'label') ?? t.code,
  }));

  const data: TalentDetailsData = {
    personal: {
      full_name: profile?.full_name ?? null,
      gender: profile?.gender ?? null,
      birth_date: profile?.birth_date ?? null,
    },
    contact: {
      email: profile?.email ?? null,
      phone: profile?.phone ?? null,
      preferred_contact: profile?.preferred_contact ?? null,
      address: (profile?.address as unknown as AddressValue) ?? null,
      preferred_country: profile?.preferred_country ?? null,
      preferred_city: profile?.preferred_city ?? null,
    },
    professional: {
      professional_status: tp.professional_status,
      previous_experience: tp.previous_experience,
    },
    services,
    paymentPrefs: {
      preferred_payment: tp.preferred_payment,
      has_social_security: tp.has_social_security,
      fiscal_id_type_id: tp.fiscal_id_type_id,
      fiscal_id: tp.fiscal_id,
    },
    languages: {
      language_codes: (languageCodesRes.data ?? []).map((l) => l.language_code),
    },
    survey,
  };

  const context: TalentDetailContext = {
    countries,
    cities,
    availableServices,
    spokenLanguages,
    surveyQuestions,
    fiscalIdTypes,
  };

  return { data, context };
}
