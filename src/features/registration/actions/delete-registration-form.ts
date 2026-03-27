'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { deleteRegistrationFormSchema } from '../schemas';

/**
 * Deletes a General registration form and all its data via CASCADE.
 * Only General forms (parent_id IS NULL) can be deleted; variants
 * are removed automatically by the parent_id CASCADE.
 */
export async function deleteRegistrationForm(id: string) {
  const parsed = deleteRegistrationFormSchema.safeParse({ id });
  if (!parsed.success) return { error: { _validation: ['Invalid form ID'] } };

  const supabase = createClient();

  const { data, error } = await supabase
    .from('registration_forms')
    .delete()
    .eq('id', parsed.data.id)
    .is('parent_id', null)
    .select('id');

  if (error) return { error: { _db: [error.message] } };

  if (!data || data.length === 0) {
    return { error: { _notFound: ['Form not found'] } };
  }

  revalidatePath('/[locale]/(admin)/admin/talent-registration', 'layout');
  return { data: { id: parsed.data.id } };
}
