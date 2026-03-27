'use server';

import { createClient } from '@/lib/supabase/server';
import type { RegistrationFormListItem } from '../types';

/**
 * Lists all General registration forms for the admin list page.
 * Includes variant count per form.
 */
export async function listRegistrationForms(): Promise<RegistrationFormListItem[]> {
  const supabase = createClient();

  // Only General forms (city_id IS NULL, parent_id IS NULL)
  const { data: forms, error } = await supabase
    .from('registration_forms')
    .select('id, name, slug, created_at, updated_at')
    .is('city_id', null)
    .is('parent_id', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!forms || forms.length === 0) return [];

  const slugs = forms.map((f) => f.slug);

  // Count variants per slug (city_id IS NOT NULL)
  const { data: variants } = await supabase
    .from('registration_forms')
    .select('slug')
    .not('city_id', 'is', null)
    .in('slug', slugs);

  const variantCountMap = new Map<string, number>();
  for (const v of variants ?? []) {
    variantCountMap.set(v.slug, (variantCountMap.get(v.slug) ?? 0) + 1);
  }

  return forms.map((f) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    variant_count: variantCountMap.get(f.slug) ?? 0,
    created_at: f.created_at,
    updated_at: f.updated_at,
  }));
}
