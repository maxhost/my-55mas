'use server';

import { createClient } from '@/lib/supabase/server';

const FALLBACK_LOCALE = 'es';

export type TalentServiceStatusItem = {
  serviceId: string;
  slug: string;
  label: string;
  hasFormData: boolean;
};

export type TalentServicesStatusResult =
  | {
      ok: true;
      services: TalentServiceStatusItem[];
      saved: number;
      total: number;
      countryId: string;
      cityId: string | null;
    }
  | {
      ok: false;
      reason: 'not-authenticated' | 'no-talent-profile' | 'talent-country-not-set';
    };

// Lee el status de talent_services del talent autenticado, filtrando por
// (status='published' AND service_countries.country_id AND
// service_cities.city_id) — coherente con el dropdown del onboarding.
//
// Identidad y context country/city se resuelven server-side desde la
// sesión + talent_profiles. El cliente nunca los pasa.
//
// Filtro silent-skip: rows de talent_services que apuntan a servicios
// que ya no cumplen los 3 criterios NO se incluyen en el resultado. El
// row queda intacto en DB. Esto evita bloquear el flow del talent por
// estado de servicios fuera de su control (admin desactiva, talent
// cambia de city, etc.).
export async function getTalentServicesStatus(
  locale: string
): Promise<TalentServicesStatusResult> {
  const supabase = createClient();

  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) return { ok: false, reason: 'not-authenticated' };

  const { data: profile } = await supabase
    .from('talent_profiles')
    .select('id, country_id, city_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) return { ok: false, reason: 'no-talent-profile' };
  if (!profile.country_id) {
    return { ok: false, reason: 'talent-country-not-set' };
  }

  const talentId = profile.id;
  const countryId = profile.country_id;
  const cityId = profile.city_id;

  // 1. Rows del talent en talent_services para este country.
  const { data: tsRows } = await supabase
    .from('talent_services')
    .select('service_id, form_data')
    .eq('talent_id', talentId)
    .eq('country_id', countryId);
  const tsMap = new Map<string, { hasFormData: boolean }>();
  for (const r of tsRows ?? []) {
    tsMap.set(r.service_id as string, { hasFormData: r.form_data !== null });
  }
  if (tsMap.size === 0) {
    return { ok: true, services: [], saved: 0, total: 0, countryId, cityId };
  }

  // 2. Filtro: published.
  const tsIds = Array.from(tsMap.keys());
  const { data: pubServices } = await supabase
    .from('services')
    .select('id, slug, service_translations(locale, name)')
    .in('id', tsIds)
    .eq('status', 'published');
  const publishedById = new Map<
    string,
    {
      slug: string;
      translations: { locale: string; name: string }[];
    }
  >();
  for (const s of pubServices ?? []) {
    publishedById.set(s.id as string, {
      slug: s.slug as string,
      translations:
        (s.service_translations as unknown as {
          locale: string;
          name: string;
        }[]) ?? [],
    });
  }

  // 3. Filtro: service_countries para countryId.
  const { data: scRows } = await supabase
    .from('service_countries')
    .select('service_id')
    .eq('country_id', countryId)
    .in('service_id', tsIds);
  const inCountry = new Set((scRows ?? []).map((r) => r.service_id as string));

  // 4. Filtro: service_cities para cityId (sólo si cityId no null).
  let inCity: Set<string> | null = null;
  if (cityId) {
    const { data: scityRows } = await supabase
      .from('service_cities')
      .select('service_id')
      .eq('city_id', cityId)
      .in('service_id', tsIds);
    inCity = new Set((scityRows ?? []).map((r) => r.service_id as string));
  }

  // 5. Intersección + label resolution.
  const services: TalentServiceStatusItem[] = [];
  for (const [serviceId, { hasFormData }] of Array.from(tsMap.entries())) {
    const pub = publishedById.get(serviceId);
    if (!pub) continue;
    if (!inCountry.has(serviceId)) continue;
    if (inCity !== null && !inCity.has(serviceId)) continue;
    const pick = (l: string) => pub.translations.find((t) => t.locale === l)?.name;
    const label = pick(locale) ?? pick(FALLBACK_LOCALE) ?? pub.slug;
    services.push({ serviceId, slug: pub.slug, label, hasFormData });
  }
  services.sort((a, b) => a.label.localeCompare(b.label));

  const saved = services.filter((s) => s.hasFormData).length;
  return {
    ok: true,
    services,
    saved,
    total: services.length,
    countryId,
    cityId,
  };
}
