'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Batch update is_active flag for registration form variants.
 * Only sends changed variants.
 */
export async function saveRegistrationActivation(
  changes: { id: string; is_active: boolean }[]
) {
  if (changes.length === 0) return { data: true };

  const supabase = createClient();

  for (const { id, is_active } of changes) {
    const { error } = await supabase
      .from('registration_forms')
      .update({ is_active })
      .eq('id', id);
    if (error) return { error: { _db: [error.message] } };
  }

  revalidatePath('/[locale]/(admin)/admin/forms', 'layout');
  return { data: true };
}
