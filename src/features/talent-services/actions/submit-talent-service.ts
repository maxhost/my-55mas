'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ResolvedForm } from '@/shared/lib/field-catalog/resolved-types';
import { persistFormData } from '@/shared/lib/field-catalog/persist-form-data';

type SubmitInput = {
  talent_id: string;
  service_id: string;
  country_id: string;
  form_id: string;
  form_data: Record<string, unknown>;
  resolved_form: ResolvedForm;
};

// Guarda el form completo de un talent_service. Asume que talent_services
// ya tiene un row para (talent_id, service_id, country_id) — crea/actualiza
// el registro con form_id, luego despacha todos los fields a sus adapters.
//
// Cambio de email del usuario autenticado (requiere supabase.auth.updateUser
// con confirmación por email) → no implementado v1.
export async function submitTalentService(input: SubmitInput) {
  const { talent_id, service_id, country_id, form_id, form_data, resolved_form } =
    input;
  const supabase = createClient();

  // Upsert talent_services header (form_id + contexto).
  const { error: tsError } = await supabase
    .from('talent_services')
    .upsert(
      { talent_id, service_id, country_id, form_id },
      { onConflict: 'talent_id,service_id,country_id' }
    );
  if (tsError) return { error: { _db: [tsError.message] } };

  const fields = resolved_form.steps.flatMap((s) => s.fields);
  // En este flow no hay auth — el talent ya está autenticado.
  const nonAuthFields = fields.filter((f) => f.persistence_type !== 'auth');

  const result = await persistFormData({
    supabase,
    userId: talent_id,
    fields: nonAuthFields,
    formData: form_data,
    context: { serviceSelect: { country_id } },
  });
  if (!result.ok) {
    return { error: { _db: result.errors.map((e) => e.message) } };
  }

  revalidatePath('/[locale]/(talent)/portal', 'layout');
  return { data: { talent_id, service_id } };
}
