'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { I18nRecord } from '@/shared/lib/json';
import type { AddressValue } from '@/shared/components/address-autocomplete';
import type {
  CityRef,
  ClientDetailContext,
  ClientDetailsData,
  CountryRef,
  FiscalIdTypeRef,
} from '../types';

type Result = {
  data: ClientDetailsData;
  context: ClientDetailContext;
};

export async function getClientDetailsData(
  clientId: string,
  locale: string,
): Promise<Result | null> {
  const supabase = createClient();

  const { data: client } = await supabase
    .from('client_profiles')
    .select(
      'id, user_id, is_business, company_name, company_tax_id, fiscal_id_type_id, billing_address, billing_state, billing_postal_code',
    )
    .eq('id', clientId)
    .maybeSingle();
  if (!client) return null;

  const [profileRes, countriesRes, citiesRes, fiscalTypesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, phone, address, preferred_country, preferred_city')
      .eq('id', client.user_id)
      .maybeSingle(),
    supabase.from('countries').select('id, code, i18n').eq('is_active', true),
    supabase.from('cities').select('id, country_id, i18n'),
    supabase
      .from('fiscal_id_types')
      .select('id, code, i18n')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ]);

  const profile = profileRes.data;

  const countries: CountryRef[] = (countriesRes.data ?? []).map((c) => ({
    id: c.id,
    code: c.code,
    name: localizedField(c.i18n as I18nRecord, locale, 'name') ?? c.code,
  }));

  const cities: CityRef[] = (citiesRes.data ?? []).map((c) => ({
    id: c.id,
    country_id: c.country_id,
    name: localizedField(c.i18n as I18nRecord, locale, 'name') ?? '',
  }));

  const fiscalIdTypes: FiscalIdTypeRef[] = (fiscalTypesRes.data ?? []).map((t) => ({
    id: t.id,
    code: t.code,
    label: localizedField(t.i18n as I18nRecord, locale, 'label') ?? t.code,
  }));

  const data: ClientDetailsData = {
    personal: {
      full_name: profile?.full_name ?? null,
      is_business: client.is_business,
      company_name: client.company_name,
      phone: profile?.phone ?? null,
    },
    contact: {
      email: profile?.email ?? null,
      address: (profile?.address as unknown as AddressValue) ?? null,
      preferred_country: profile?.preferred_country ?? null,
      preferred_city: profile?.preferred_city ?? null,
    },
    billing: {
      fiscal_id_type_id: client.fiscal_id_type_id,
      company_tax_id: client.company_tax_id,
      billing_address: client.billing_address,
      billing_state: client.billing_state,
      billing_postal_code: client.billing_postal_code,
    },
  };

  const context: ClientDetailContext = {
    countries,
    cities,
    fiscalIdTypes,
  };

  return { data, context };
}
