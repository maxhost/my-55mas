'use server';

import { createClient } from '@/lib/supabase/server';
import type { ServiceSelectOption } from '@/shared/lib/forms/types';

/**
 * Load published services as options for `service_select` form fields.
 * Only returns services with status='published', translated to the given locale.
 */
export async function getServiceOptionsForForm(
  locale: string
): Promise<ServiceSelectOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('service_translations')
    .select('service_id, name, services!inner(status)')
    .eq('locale', locale)
    .eq('services.status', 'published')
    .order('name', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({ id: row.service_id, name: row.name }));
}
