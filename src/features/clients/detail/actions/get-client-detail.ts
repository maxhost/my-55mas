'use server';

import { createClient } from '@/lib/supabase/server';
import { composeClientDetail } from '../lib/compose-client-detail';
import type { ClientDetail } from '../types';

export async function getClientDetail(
  clientId: string,
  locale: string,
): Promise<ClientDetail | null> {
  const supabase = createClient();

  const { data: client } = await supabase
    .from('client_profiles')
    .select('id, user_id, status, is_business, company_name, created_at, updated_at')
    .eq('id', clientId)
    .maybeSingle();
  if (!client) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, phone, avatar_url, preferred_country, preferred_city')
    .eq('id', client.user_id)
    .maybeSingle();

  const [countryRes, cityRes] = await Promise.all([
    profile?.preferred_country
      ? supabase
          .from('countries')
          .select('id, i18n')
          .eq('id', profile.preferred_country)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    profile?.preferred_city
      ? supabase
          .from('cities')
          .select('id, i18n')
          .eq('id', profile.preferred_city)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return composeClientDetail({
    profile: profile ?? null,
    clientProfile: client,
    country: countryRes.data ?? null,
    city: cityRes.data ?? null,
    locale,
  });
}
