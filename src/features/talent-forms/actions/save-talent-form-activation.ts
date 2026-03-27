'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type ActivationChange = {
  form_id: string;
  is_active: boolean;
};

/**
 * Batch-saves is_active state for multiple talent form variants.
 * Only sends the changes (not all variants).
 */
export async function saveTalentFormActivation(
  changes: ActivationChange[]
): Promise<{ data: true } | { error: Record<string, string[]> }> {
  if (changes.length === 0) return { data: true };

  const supabase = createClient();

  for (const change of changes) {
    const { error } = await supabase
      .from('talent_forms')
      .update({ is_active: change.is_active })
      .eq('id', change.form_id);

    if (error) return { error: { _db: [error.message] } };
  }

  revalidatePath('/[locale]/(admin)/admin/talent-forms', 'layout');
  return { data: true };
}
