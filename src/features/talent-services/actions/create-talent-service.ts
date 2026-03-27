'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Creates an empty talent form for a service (General variant).
 * No-op if a talent form already exists for this service.
 */
export async function createTalentService(
  serviceId: string
): Promise<{ id: string } | { error: Record<string, string[]> }> {
  const supabase = createClient();

  // Check if one already exists
  const { data: existing } = await supabase
    .from('talent_forms')
    .select('id')
    .eq('service_id', serviceId)
    .is('city_id', null)
    .limit(1);

  if (existing && existing.length > 0) return { id: existing[0].id };

  const { data: newForm, error } = await supabase
    .from('talent_forms')
    .insert({
      service_id: serviceId,
      schema: { steps: [] },
    })
    .select('id')
    .single();

  if (error) return { error: { _db: [error.message] } };

  revalidatePath('/[locale]/(admin)/admin/talent-services', 'layout');
  return { id: newForm.id };
}
