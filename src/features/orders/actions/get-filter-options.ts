'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { CountryOption, CityOption, PersonOption } from '../types';

type I18nRecord = Record<string, Record<string, unknown>> | null;

export async function getCountryOptions(locale: string): Promise<CountryOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('countries')
    .select('id, i18n')
    .eq('is_active', true);

  if (error) throw error;

  return (data ?? [])
    .map((row) => ({
      id: row.id,
      name: localizedField(row.i18n as I18nRecord, locale, 'name') ?? row.id,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCityOptions(locale: string): Promise<CityOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('cities')
    .select('id, country_id, i18n')
    .eq('is_active', true);

  if (error) throw error;

  return (data ?? [])
    .map((row) => ({
      id: row.id,
      name: localizedField(row.i18n as I18nRecord, locale, 'name') ?? row.id,
      country_id: row.country_id,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTalentOptions(): Promise<PersonOption[]> {
  const supabase = createClient();

  const { data: orderTalents, error: orderErr } = await supabase
    .from('orders')
    .select('talent_id')
    .not('talent_id', 'is', null);

  if (orderErr) throw orderErr;

  const ids = Array.from(new Set((orderTalents ?? []).map((r) => r.talent_id as string)));
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', ids)
    .order('full_name', { ascending: true });

  if (error) throw error;

  return (data ?? [])
    .filter((p) => p.full_name)
    .map((p) => ({ id: p.id, name: p.full_name! }));
}

export async function getClientOptions(): Promise<PersonOption[]> {
  const supabase = createClient();

  const { data: orderClients, error: orderErr } = await supabase
    .from('orders')
    .select('client_id');

  if (orderErr) throw orderErr;

  const ids = Array.from(new Set((orderClients ?? []).map((r) => r.client_id)));
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', ids)
    .order('full_name', { ascending: true });

  if (error) throw error;

  return (data ?? [])
    .filter((p) => p.full_name)
    .map((p) => ({ id: p.id, name: p.full_name! }));
}

export async function getStaffOptions(): Promise<PersonOption[]> {
  const supabase = createClient();

  const { data: orderStaff, error: orderErr } = await supabase
    .from('orders')
    .select('staff_member_id')
    .not('staff_member_id', 'is', null);

  if (orderErr) throw orderErr;

  const ids = Array.from(new Set((orderStaff ?? []).map((r) => r.staff_member_id as string)));
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('staff_profiles')
    .select('id, first_name, last_name')
    .in('id', ids);

  if (error) throw error;

  return (data ?? [])
    .map((s) => ({
      id: s.id,
      name: `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim(),
    }))
    .filter((s) => s.name)
    .sort((a, b) => a.name.localeCompare(b.name));
}
