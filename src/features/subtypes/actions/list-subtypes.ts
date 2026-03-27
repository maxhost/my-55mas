'use server';

import { createClient } from '@/lib/supabase/server';
import type { SubtypeWithTranslations } from '../types';

/**
 * Lists all subtypes for a service, with translations.
 * Returns them sorted by sort_order.
 */
export async function listSubtypes(
  serviceId: string
): Promise<SubtypeWithTranslations[]> {
  const supabase = createClient();

  const { data: subtypes, error } = await supabase
    .from('service_subtypes')
    .select('id, service_id, slug, sort_order, is_active')
    .eq('service_id', serviceId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  if (!subtypes || subtypes.length === 0) return [];

  const subtypeIds = subtypes.map((s) => s.id);

  const { data: translations, error: transError } = await supabase
    .from('service_subtype_translations')
    .select('subtype_id, locale, name')
    .in('subtype_id', subtypeIds);

  if (transError) throw transError;

  // Group translations by subtype_id
  const transMap = new Map<string, Record<string, string>>();
  for (const t of translations ?? []) {
    if (!transMap.has(t.subtype_id)) transMap.set(t.subtype_id, {});
    transMap.get(t.subtype_id)![t.locale] = t.name;
  }

  return subtypes.map((s) => ({
    id: s.id,
    service_id: s.service_id,
    slug: s.slug,
    sort_order: s.sort_order ?? 0,
    is_active: s.is_active,
    translations: transMap.get(s.id) ?? {},
  }));
}
