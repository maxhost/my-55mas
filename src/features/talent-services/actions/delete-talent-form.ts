'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { deleteTalentFormSchema } from '../schemas';

/**
 * Deletes ALL talent_forms for a given service (General + city variants).
 * Translations cascade-delete via FK. talent_services.form_id is SET NULL.
 */
export async function deleteTalentForm(serviceId: string) {
  const parsed = deleteTalentFormSchema.safeParse({ serviceId });
  if (!parsed.success) return { error: { _validation: ['Invalid service ID'] } };

  const supabase = createClient();

  const { data, error } = await supabase
    .from('talent_forms')
    .delete()
    .eq('service_id', parsed.data.serviceId)
    .select('id');

  if (error) return { error: { _db: [error.message] } };
  if (!data || data.length === 0) return { error: { _notFound: ['Form not found'] } };

  revalidatePath('/[locale]/(admin)/admin/talent-services', 'layout');
  return { data: { deleted: data.length } };
}
