'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ResolvedForm } from '@/shared/lib/field-catalog/resolved-types';
import { persistFormData } from '@/shared/lib/field-catalog/persist-form-data';

type SubmitInput = {
  service_id: string;
  form_id: string;
  form_data: Record<string, unknown>;
  resolved_form: ResolvedForm;
};

type SubmitResult =
  | { data: { talent_id: string; service_id: string } }
  | { error: Record<string, string[]> };

// Guarda el form completo de un talent_service.
//
// Identidad y contexto se resuelven 100% server-side desde la sesión:
// - talent_id ← talent_profiles.id (lookup por user_id de auth.getUser).
// - country_id ← talent_profiles.country_id.
// El client NO pasa talent_id ni country_id (sería spoofable).
//
// Reglas:
// - User no autenticado → _auth: notAuthenticated.
// - User sin talent_profiles → _auth: noTalentProfile.
// - Talent sin country_id (column NOT NULL en talent_services) → _config:
//   countryIdRequired. Aplica siempre, no sólo con service_select.
// - Auth fields NO se filtran: writeAuth en edit flow es no-op si email
//   no cambió, o updateUser si allow_change=true y cambió.
export async function submitTalentService(input: SubmitInput): Promise<SubmitResult> {
  const { service_id, form_id, form_data, resolved_form } = input;
  const supabase = createClient();

  // 1. Identity desde la sesión.
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) return { error: { _auth: ['notAuthenticated'] } };

  const { data: profile } = await supabase
    .from('talent_profiles')
    .select('id, country_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) return { error: { _auth: ['noTalentProfile'] } };

  const talent_id = profile.id;
  const country_id = profile.country_id;

  // 2. country_id es NOT NULL en talent_services + load-bearing para el
  // adapter service_select. Si el talent no lo tiene seteado, no podemos
  // persistir — fail temprano con error claro.
  if (!country_id) {
    return { error: { _config: ['countryIdRequired'] } };
  }

  // 3. Upsert header de talent_services (form_id + contexto).
  const { error: tsError } = await supabase
    .from('talent_services')
    .upsert(
      { talent_id, service_id, country_id, form_id },
      { onConflict: 'talent_id,service_id,country_id' }
    );
  if (tsError) return { error: { _db: [tsError.message] } };

  // 4. Persistir todos los fields (auth incluidos — writeAuth maneja
  // edit flow). El context.serviceSelect se pasa siempre; el adapter
  // sólo lo usa si hay un service_select field.
  const fields = resolved_form.steps.flatMap((s) => s.fields);
  const result = await persistFormData({
    supabase,
    userId: talent_id,
    fields,
    formData: form_data,
    context: { serviceSelect: { country_id } },
  });
  if (!result.ok) {
    return { error: { _db: result.errors.map((e) => e.message) } };
  }

  revalidatePath('/[locale]/(talent)/portal', 'layout');
  return { data: { talent_id, service_id } };
}
