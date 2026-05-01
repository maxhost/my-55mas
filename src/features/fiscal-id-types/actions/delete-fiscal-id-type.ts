'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type DeleteResult = { data: { id: string } } | { error: Record<string, string[]> };

/**
 * Soft delete: marks as inactive. Preserves talent_profiles.fiscal_id_type_id history.
 */
export async function deleteFiscalIdType(id: string): Promise<DeleteResult> {
  if (!id) return { error: { id: ['id is required'] } };

  const supabase = createClient();
  const { error } = await supabase
    .from('fiscal_id_types')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return { error: { _db: [error.message] } };

  revalidatePath('/[locale]/(admin)/admin/fiscal-id-types', 'layout');
  return { data: { id } };
}
