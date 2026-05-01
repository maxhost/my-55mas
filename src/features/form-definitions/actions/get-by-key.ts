'use server';

import { createClient } from '@/lib/supabase/server';
import type { FormDefinition, FormKey } from '../types';

export async function getFormDefinitionByKey(key: FormKey): Promise<FormDefinition | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('form_definitions')
    .select('*')
    .eq('form_key', key)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return data as unknown as FormDefinition;
}
