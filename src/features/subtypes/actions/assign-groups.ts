'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { assignGroupsSchema } from '../schemas';
import type { AssignGroupsInput } from '../types';

/**
 * Assigns subtype groups to a service (full replace).
 * Deletes existing assignments and inserts new ones with sort_order.
 */
export async function assignGroups(input: AssignGroupsInput) {
  const parsed = assignGroupsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { service_id, group_ids } = parsed.data;
  const supabase = createClient();

  // 1. Delete existing assignments for this service
  const { error: delError } = await supabase
    .from('service_subtype_group_assignments')
    .delete()
    .eq('service_id', service_id);

  if (delError) return { error: { _db: [delError.message] } };

  // 2. Insert new assignments
  if (group_ids.length > 0) {
    const rows = group_ids.map((g) => ({
      service_id,
      group_id: g.group_id,
      sort_order: g.sort_order,
    }));

    const { error: insError } = await supabase
      .from('service_subtype_group_assignments')
      .insert(rows);

    if (insError) return { error: { _db: [insError.message] } };
  }

  revalidatePath('/[locale]/(admin)/admin/services', 'layout');
  return { data: { service_id } };
}
