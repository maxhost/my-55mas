'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import type { FieldUsage, ToggleFieldActiveResult } from '../types';
import { findFieldUsage } from './find-field-usage';

export async function toggleFieldActive(
  fieldDefinitionId: string,
  nextActive: boolean
): Promise<ToggleFieldActiveResult> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('form_field_definitions')
    .update({ is_active: nextActive, updated_at: new Date().toISOString() })
    .eq('id', fieldDefinitionId);
  if (error) return { ok: false, error: error.message };

  let usage: FieldUsage[] = [];
  if (!nextActive) {
    const usageRes = await findFieldUsage(fieldDefinitionId);
    if (!usageRes.ok) return { ok: false, error: usageRes.error };
    usage = usageRes.data;
  }

  revalidatePath('/[locale]/(admin)/admin/field-catalog', 'layout');
  return {
    ok: true,
    data: { id: fieldDefinitionId, is_active: nextActive, usage },
  };
}
