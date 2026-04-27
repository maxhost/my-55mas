import type { Sb } from './persistence/context';

const FALLBACK_LOCALE = 'es';

export type ServiceOption = {
  id: string;
  name: string;
};

// Carga servicios publicados para usar como opciones de un field con
// persistence_type='service_select'. Mismo pattern que subtype: nombres
// traducidos con fallback a 'es', fallback final al id.
// Sin filtro por país — usado en contextos admin/preview que no tienen
// contexto de talent (ej: builder previews). Para flows de talent, usar
// `loadAvailableServicesForTalent` que aplica el filtro country+city.
export async function loadPublishedServicesForLocale(
  supabase: Sb,
  locale: string
): Promise<ServiceOption[]> {
  const { data, error } = await supabase
    .from('services')
    .select('id, status, service_translations(locale, name)')
    .eq('status', 'published');
  if (error || !data) return [];

  return data.map((row) => {
    const trans =
      (row.service_translations as unknown as {
        locale: string;
        name: string;
      }[]) ?? [];
    const pick = (l: string) => trans.find((t) => t.locale === l)?.name;
    const name = pick(locale) ?? pick(FALLBACK_LOCALE) ?? row.id;
    return { id: row.id as string, name };
  });
}

// Carga servicios disponibles para un talent en un (countryId, cityId)
// específico. Aplica los 3 criterios de disponibilidad:
//   1. services.status = 'published'
//   2. service_countries debe contener (service_id, countryId)
//   3. service_cities debe contener (service_id, cityId) — sólo si
//      cityId no es null. Si cityId es null, filtramos sólo por country.
//
// Se hace en 3 queries y se hace intersección en JS (no INNER JOIN PostgREST
// con embed) — más simple y suficiente para v1. Las cantidades son chicas
// (decenas de servicios típicamente).
export async function loadAvailableServicesForTalent(
  supabase: Sb,
  locale: string,
  countryId: string,
  cityId: string | null
): Promise<ServiceOption[]> {
  // 1. Services published.
  const { data: services, error: sErr } = await supabase
    .from('services')
    .select('id, service_translations(locale, name)')
    .eq('status', 'published');
  if (sErr || !services) return [];

  const publishedIds = new Set(services.map((s) => s.id as string));
  if (publishedIds.size === 0) return [];

  // 2. service_countries para countryId.
  const { data: scRows } = await supabase
    .from('service_countries')
    .select('service_id')
    .eq('country_id', countryId);
  const countryIds = new Set((scRows ?? []).map((r) => r.service_id as string));

  // 3. service_cities para cityId (sólo si cityId).
  let cityIds: Set<string> | null = null;
  if (cityId) {
    const { data: scityRows } = await supabase
      .from('service_cities')
      .select('service_id')
      .eq('city_id', cityId);
    cityIds = new Set((scityRows ?? []).map((r) => r.service_id as string));
  }

  // Intersección.
  const allowed = Array.from(publishedIds).filter((id) => {
    if (!countryIds.has(id)) return false;
    if (cityIds !== null && !cityIds.has(id)) return false;
    return true;
  });
  if (allowed.length === 0) return [];

  // Resolver labels traducidos.
  const allowedSet = new Set(allowed);
  return services
    .filter((s) => allowedSet.has(s.id as string))
    .map((row) => {
      const trans =
        (row.service_translations as unknown as {
          locale: string;
          name: string;
        }[]) ?? [];
      const pick = (l: string) => trans.find((t) => t.locale === l)?.name;
      const name = pick(locale) ?? pick(FALLBACK_LOCALE) ?? row.id;
      return { id: row.id as string, name };
    });
}
