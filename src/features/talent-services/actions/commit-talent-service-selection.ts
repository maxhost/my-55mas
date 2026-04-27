'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { writeServiceSelect } from '@/shared/lib/field-catalog/persistence/service-select';

type CommitInput = {
  serviceIds: string[];
};

type CommitResult =
  | { data: { count: number } }
  | { error: Record<string, string[]> };

// Commit explícito de la selección de servicios del talent. Usado por el
// onboarding step 3 al hacer click en "Aplicar selección".
//
// Identidad y context country/city resueltos server-side. El client
// nunca pasa talentId ni countryId.
//
// Defense-in-depth: cada serviceId del input debe estar en la lista de
// servicios disponibles para (countryId, cityId, status='published').
// Si alguno falla, retorna serviceNotAvailable y no toca DB.
//
// Persistencia: delega en writeServiceSelect (diff-based desde S1), que
// es idempotente y preserva form_data de servicios untouched.
export async function commitTalentServiceSelection(
  input: CommitInput
): Promise<CommitResult> {
  const supabase = createClient();

  // 1. Identity.
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) return { error: { _auth: ['notAuthenticated'] } };

  const { data: profile } = await supabase
    .from('talent_profiles')
    .select('id, country_id, city_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) return { error: { _auth: ['noTalentProfile'] } };
  if (!profile.country_id) {
    return { error: { _config: ['talentCountryNotSet'] } };
  }

  const countryId = profile.country_id;
  const cityId = profile.city_id;

  // 2. Validación: cada serviceId debe ser uno disponible para (country, city).
  const { serviceIds } = input;
  if (serviceIds.length > 0) {
    // Published.
    const { data: pubServices } = await supabase
      .from('services')
      .select('id')
      .in('id', serviceIds)
      .eq('status', 'published');
    const publishedSet = new Set(
      (pubServices ?? []).map((s) => s.id as string)
    );
    // Country.
    const { data: scRows } = await supabase
      .from('service_countries')
      .select('service_id')
      .eq('country_id', countryId)
      .in('service_id', serviceIds);
    const inCountry = new Set(
      (scRows ?? []).map((r) => r.service_id as string)
    );
    // City (si aplica).
    let inCity: Set<string> | null = null;
    if (cityId) {
      const { data: scityRows } = await supabase
        .from('service_cities')
        .select('service_id')
        .eq('city_id', cityId)
        .in('service_id', serviceIds);
      inCity = new Set(
        (scityRows ?? []).map((r) => r.service_id as string)
      );
    }

    const invalid = serviceIds.filter((id) => {
      if (!publishedSet.has(id)) return true;
      if (!inCountry.has(id)) return true;
      if (inCity !== null && !inCity.has(id)) return true;
      return false;
    });
    if (invalid.length > 0) {
      return { error: { _config: ['serviceNotAvailable'] } };
    }
  }

  // 3. Persistir vía adapter idempotente.
  try {
    await writeServiceSelect(supabase, user.id, serviceIds, {
      country_id: countryId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return { error: { _db: [msg] } };
  }

  revalidatePath('/[locale]/(talent)', 'layout');
  return { data: { count: serviceIds.length } };
}
