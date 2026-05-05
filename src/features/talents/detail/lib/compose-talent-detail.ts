import { localizedField } from '@/shared/lib/i18n/localize';
import type { I18nRecord } from '@/shared/lib/json';
import type {
  TalentDetail,
  TalentHighlightsStats,
  TalentTagOption,
} from '../types';
import type { TalentStatus } from '../../types';

type ProfileRow = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

type TalentProfileRow = {
  id: string;
  user_id: string;
  status: string;
  country_id: string | null;
  city_id: string | null;
  photo_url: string | null;
  internal_notes: string | null;
  preferred_payment: string | null;
  onboarding_completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CountryRow = { id: string; i18n: unknown };
type CityRow = { id: string; i18n: unknown };
type TagJoinRow = { tag_id: string; talent_tags: { id: string; i18n: unknown } | null };

export function composeTalentDetail(args: {
  profile: ProfileRow | null;
  talentProfile: TalentProfileRow;
  country: CountryRow | null;
  city: CityRow | null;
  tagAssignments: TagJoinRow[];
  locale: string;
}): TalentDetail {
  const { profile, talentProfile, country, city, tagAssignments, locale } = args;
  return {
    id: talentProfile.id,
    user_id: talentProfile.user_id,
    full_name: profile?.full_name ?? null,
    email: profile?.email ?? null,
    phone: profile?.phone ?? null,
    status: talentProfile.status as TalentStatus,
    country_id: talentProfile.country_id,
    country_name: country
      ? localizedField(country.i18n as I18nRecord, locale, 'name') ?? null
      : null,
    city_id: talentProfile.city_id,
    city_name: city
      ? localizedField(city.i18n as I18nRecord, locale, 'name') ?? null
      : null,
    photo_url: talentProfile.photo_url,
    onboarding_completed_at: talentProfile.onboarding_completed_at,
    created_at: talentProfile.created_at,
    updated_at: talentProfile.updated_at,
    internal_notes: talentProfile.internal_notes,
    preferred_payment: talentProfile.preferred_payment,
    tags: composeTags(tagAssignments, locale),
  };
}

function composeTags(rows: TagJoinRow[], locale: string): TalentTagOption[] {
  return rows
    .map((r) => r.talent_tags)
    .filter((t): t is { id: string; i18n: unknown } => t !== null)
    .map((t) => ({
      id: t.id,
      name: localizedField(t.i18n as I18nRecord, locale, 'name') ?? '',
    }));
}

type OrderForStats = {
  rating: number | null;
  updated_at: string | null;
};

export function composeHighlightsStats(args: {
  orders: OrderForStats[];
  talentCreatedAt: string | null;
  talentUpdatedAt: string | null;
  now?: Date;
}): TalentHighlightsStats {
  const { orders, talentCreatedAt, talentUpdatedAt } = args;
  const now = args.now ?? new Date();
  const ratedOrders = orders.filter((o) => o.rating !== null);
  const ratingSum = ratedOrders.reduce((acc, o) => acc + (o.rating ?? 0), 0);
  const ratingAvg =
    ratedOrders.length === 0 ? null : ratingSum / ratedOrders.length;

  const lastOrderUpdate = orders
    .map((o) => (o.updated_at ? new Date(o.updated_at).getTime() : null))
    .filter((t): t is number => t !== null);
  const lastTalentUpdate = talentUpdatedAt ? new Date(talentUpdatedAt).getTime() : null;
  const lastActivityMs = Math.max(
    lastOrderUpdate.length > 0 ? Math.max(...lastOrderUpdate) : 0,
    lastTalentUpdate ?? 0,
  );
  const lastActivityDays =
    lastActivityMs > 0
      ? Math.floor((now.getTime() - lastActivityMs) / (1000 * 60 * 60 * 24))
      : null;

  const ageMonths = talentCreatedAt
    ? monthsBetween(new Date(talentCreatedAt), now)
    : 0;

  return {
    totalOrders: orders.length,
    ratingAvg,
    ratingCount: ratedOrders.length,
    ageMonths,
    lastActivityDays,
  };
}

function monthsBetween(from: Date, to: Date): number {
  const years = to.getFullYear() - from.getFullYear();
  const months = to.getMonth() - from.getMonth();
  const total = years * 12 + months;
  return total < 0 ? 0 : total;
}
