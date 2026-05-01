'use server';

import { createClient } from '@/lib/supabase/server';
import type { FormDefinition } from '../types';

export async function listFormDefinitions(): Promise<FormDefinition[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('form_definitions')
    .select('*')
    .order('form_key', { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as FormDefinition[];
}
