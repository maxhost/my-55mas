import type { Database } from '@/lib/supabase/database.types';

// ── DB Row Types ──────────────────────────────────────

type ServiceRow = Database['public']['Tables']['services']['Row'];
type ServiceTranslationRow =
  Database['public']['Tables']['service_translations']['Row'];
type ServiceCountryRow =
  Database['public']['Tables']['service_countries']['Row'];
// ── Service Status ────────────────────────────────────

export const SERVICE_STATUSES = ['draft', 'published', 'archived'] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

// ── FAQ Item ──────────────────────────────────────────

export type FaqItem = {
  question: string;
  answer: string;
};

// ── Service with translation (list view) ──────────────

export type ServiceListItem = Pick<
  ServiceRow,
  'id' | 'slug' | 'status' | 'created_at'
> & {
  name: string;
};

// ── Service with full translations (edit view) ────────

export type ServiceDetail = ServiceRow & {
  translations: ServiceTranslationDetail[];
  countries: ServiceCountryDetail[];
  cities: ServiceCityDetail[];
};

export type ServiceTranslationDetail = Pick<
  ServiceTranslationRow,
  | 'locale'
  | 'name'
  | 'description'
  | 'includes'
  | 'hero_title'
  | 'hero_subtitle'
> & {
  benefits: string[];
  guarantees: string[];
  faqs: FaqItem[];
};

export type ServiceCountryDetail = ServiceCountryRow & {
  country_name: string;
  currency: string;
  country_code: string;
};

// ── Country option (for config UI) ────────────────────

export type CountryOption = {
  id: string;
  code: string;
  name: string;
  currency: string;
};

// ── City types ───────────────────────────────────────

export type CityOption = {
  id: string;
  name: string;
  country_id: string;
};

export type ServiceCityDetail = {
  service_id: string;
  city_id: string;
  base_price: number;
  is_active: boolean;
  city_name: string;
  country_id: string;
};

