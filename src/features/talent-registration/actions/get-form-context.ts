'use server';

import { createClient } from '@/lib/supabase/server';
import { localize, localizedField } from '@/shared/lib/i18n/localize';
import type {
  CountryOption,
  FiscalIdTypeOption,
  TalentRegistrationContext,
} from '../types';

const FORM_KEY = 'talent_registration';
type I18nRecord = Record<string, Record<string, unknown>> | null;

export async function getFormContext(locale: string): Promise<TalentRegistrationContext | null> {
  const supabase = createClient();

  const { data: form } = await supabase
    .from('form_definitions')
    .select('id, schema, i18n')
    .eq('form_key', FORM_KEY)
    .eq('is_active', true)
    .maybeSingle();

  if (!form) return null;

  const { data: activations } = await supabase
    .from('form_definition_countries')
    .select('country_id')
    .eq('form_id', form.id)
    .eq('is_active', true);

  const activeCountryIds = new Set((activations ?? []).map((a) => a.country_id));
  if (activeCountryIds.size === 0) {
    return {
      formDefinitionId: form.id,
      schema: (form.schema as TalentRegistrationContext['schema']) ?? { fields: [] },
      i18n: resolveFormI18n(form.i18n as I18nRecord, locale),
      countries: [],
      fiscalIdTypes: [],
    };
  }

  const { data: countries } = await supabase
    .from('countries')
    .select('id, code, i18n')
    .eq('is_active', true)
    .in('id', Array.from(activeCountryIds));

  const countryOptions: CountryOption[] = (countries ?? [])
    .map((c) => ({
      id: c.id,
      code: c.code,
      name: localizedField(c.i18n as I18nRecord, locale, 'name') ?? c.code,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const { data: types } = await supabase
    .from('fiscal_id_types')
    .select('id, code, i18n, fiscal_id_type_countries(country_id)')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const fiscalIdTypes: FiscalIdTypeOption[] = (types ?? []).map((t) => {
    const junction = (t.fiscal_id_type_countries ?? []) as { country_id: string }[];
    return {
      id: t.id,
      code: t.code,
      label: localizedField(t.i18n as I18nRecord, locale, 'label') ?? t.code,
      countryIds: junction.map((j) => j.country_id),
    };
  });

  return {
    formDefinitionId: form.id,
    schema: (form.schema as TalentRegistrationContext['schema']) ?? { fields: [] },
    i18n: resolveFormI18n(form.i18n as I18nRecord, locale),
    countries: countryOptions,
    fiscalIdTypes,
  };
}

function resolveFormI18n(i18n: I18nRecord, locale: string): TalentRegistrationContext['i18n'] {
  const entry = (localize(i18n, locale) ?? {}) as {
    title?: string;
    submitLabel?: string;
    fields?: TalentRegistrationContext['i18n']['fields'];
  };
  return {
    title: entry.title,
    submitLabel: entry.submitLabel,
    fields: entry.fields ?? {},
  };
}
