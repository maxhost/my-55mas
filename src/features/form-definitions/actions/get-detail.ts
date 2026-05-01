'use server';

import { createClient } from '@/lib/supabase/server';
import type { FormDefinitionDetail } from '../types';

export async function getFormDefinitionDetail(id: string): Promise<FormDefinitionDetail | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('form_definitions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { data: activations, error: actError } = await supabase
    .from('form_definition_countries')
    .select('country_id')
    .eq('form_id', id)
    .eq('is_active', true);

  if (actError) throw actError;

  return {
    ...(data as unknown as FormDefinitionDetail),
    activeCountryIds: (activations ?? []).map((a) => a.country_id),
  };
}
