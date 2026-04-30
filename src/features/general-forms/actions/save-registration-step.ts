'use server';

import { createClient } from '@/lib/supabase/server';
import type { ResolvedForm } from '@/shared/lib/field-catalog/resolved-types';
import { persistFormData } from '@/shared/lib/field-catalog/persist-form-data';

type SaveStepInput = {
  form_data: Record<string, unknown>;
  resolved_form: ResolvedForm;
  target_role: 'talent' | 'client';
};

// Persiste fields de un upsert sobre el user autenticado (action=submit).
// Incluye auth fields: writeAuth en edit flow es no-op si el email no
// cambió, y dispara updateUser si allow_change=true y el user lo editó.
// Si hay service_select fields, el adapter requiere country_id; lo
// resolvemos desde talent_profiles para el user autenticado.
//
// Defense-in-depth: si el schema tiene un field `talent_services_panel`,
// validamos saved===total>0 server-side antes de avanzar. Cubre el caso
// del cliente manipulado (DevTools) o de bugs en setFieldError. Coherente
// con la regla: el panel exige que TODOS los servicios tengan form_data.
export async function saveRegistrationStep(input: SaveStepInput) {
  const { form_data, resolved_form, target_role } = input;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { _auth: ['User not authenticated'] } };

  const allFields = resolved_form.steps.flatMap((s) => s.fields);

  // Defense-in-depth: si hay un field talent_services_panel, validar
  // que todos los servicios elegidos tienen form_data. Si no, bloquear.
  // Query inline (no importa de features/talent-services/ — regla §3
  // architecture.md). Cubre el caso del cliente manipulado (DevTools
  // bypass del setFieldError) o de bugs en el renderer.
  const hasPanel = allFields.some(
    (f) => f.input_type === 'talent_services_panel'
  );
  if (hasPanel) {
    const { data: profile } = await supabase
      .from('talent_profiles')
      .select('id, country_id, city_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!profile) return { error: { _config: ['no-talent-profile'] } };
    if (!profile.country_id) {
      return { error: { _config: ['talent-country-not-set'] } };
    }
    // Cuenta talent_services del talent en su country, filtrados por
    // disponibilidad: services.published + service_countries + service_cities.
    // Mismo criterio que `getTalentServicesStatus` del feature talent-services
    // — duplicado intencionalmente para mantener isolation feature↔feature.
    const { data: tsRows } = await supabase
      .from('talent_services')
      .select('service_id, form_data')
      .eq('talent_id', profile.id)
      .eq('country_id', profile.country_id);
    const tsMap = new Map<string, boolean>();
    for (const r of tsRows ?? []) {
      tsMap.set(r.service_id as string, r.form_data !== null);
    }
    if (tsMap.size === 0) {
      return { error: { _config: ['atLeastOneService'] } };
    }
    const tsIds = Array.from(tsMap.keys());
    const { data: pubServices } = await supabase
      .from('services')
      .select('id')
      .in('id', tsIds)
      .eq('status', 'published');
    const publishedSet = new Set(
      (pubServices ?? []).map((s) => s.id as string)
    );
    const { data: scRows } = await supabase
      .from('service_countries')
      .select('service_id')
      .eq('country_id', profile.country_id)
      .in('service_id', tsIds);
    const inCountry = new Set(
      (scRows ?? []).map((r) => r.service_id as string)
    );
    let inCity: Set<string> | null = null;
    if (profile.city_id) {
      const { data: scityRows } = await supabase
        .from('service_cities')
        .select('service_id')
        .eq('city_id', profile.city_id)
        .in('service_id', tsIds);
      inCity = new Set(
        (scityRows ?? []).map((r) => r.service_id as string)
      );
    }
    let total = 0;
    let saved = 0;
    for (const [serviceId, hasFormData] of Array.from(tsMap.entries())) {
      if (!publishedSet.has(serviceId)) continue;
      if (!inCountry.has(serviceId)) continue;
      if (inCity !== null && !inCity.has(serviceId)) continue;
      total++;
      if (hasFormData) saved++;
    }
    if (total === 0) {
      return { error: { _config: ['atLeastOneService'] } };
    }
    if (saved < total) {
      return { error: { _config: ['saveAllServicesFirst'] } };
    }
  }

  const needsServiceSelect = allFields.some(
    (f) => f.persistence_type === 'service_select'
  );

  let serviceSelectCountryId: string | null = null;
  if (needsServiceSelect && target_role === 'talent') {
    const { data: tp } = await supabase
      .from('talent_profiles')
      .select('country_id')
      .eq('user_id', user.id)
      .maybeSingle();
    serviceSelectCountryId = tp?.country_id ?? null;
  }

  const result = await persistFormData({
    supabase,
    userId: user.id,
    fields: allFields,
    formData: form_data,
    context: serviceSelectCountryId
      ? { serviceSelect: { country_id: serviceSelectCountryId } }
      : undefined,
  });
  if (!result.ok) {
    return { error: { _db: result.errors.map((e) => e.message) } };
  }

  return { data: { user_id: user.id } };
}
