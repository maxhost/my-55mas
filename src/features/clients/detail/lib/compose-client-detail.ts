import { localizedField } from '@/shared/lib/i18n/localize';
import type { I18nRecord } from '@/shared/lib/json';
import type { ClientDetail } from '../types';
import type { ClientStatus } from '../../types';

type ProfileRow = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  preferred_country: string | null;
  preferred_city: string | null;
};

type ClientProfileRow = {
  id: string;
  user_id: string;
  status: string;
  is_business: boolean;
  company_name: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CountryRow = { id: string; i18n: unknown };
type CityRow = { id: string; i18n: unknown };

export function composeClientDetail(args: {
  profile: ProfileRow | null;
  clientProfile: ClientProfileRow;
  country: CountryRow | null;
  city: CityRow | null;
  locale: string;
}): ClientDetail {
  const { profile, clientProfile, country, city, locale } = args;
  return {
    id: clientProfile.id,
    user_id: clientProfile.user_id,
    full_name: profile?.full_name ?? null,
    email: profile?.email ?? null,
    phone: profile?.phone ?? null,
    avatar_url: profile?.avatar_url ?? null,
    is_business: clientProfile.is_business,
    company_name: clientProfile.company_name,
    status: clientProfile.status as ClientStatus,
    country_id: profile?.preferred_country ?? null,
    country_name: country
      ? localizedField(country.i18n as I18nRecord, locale, 'name') ?? null
      : null,
    city_id: profile?.preferred_city ?? null,
    city_name: city
      ? localizedField(city.i18n as I18nRecord, locale, 'name') ?? null
      : null,
    created_at: clientProfile.created_at,
    updated_at: clientProfile.updated_at,
  };
}
