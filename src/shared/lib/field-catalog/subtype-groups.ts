import type { Sb } from './persistence/context';

const FALLBACK_LOCALE = 'es';

export type SubtypeGroupOption = {
  slug: string;
  name: string;
};

// Lista grupos de subtypes activos para el picker del admin.
// Devuelve { slug, name } donde name está en el locale pedido, con fallback
// a 'es', con fallback final al slug.
export async function listSubtypeGroupsForPicker(
  supabase: Sb,
  locale: string
): Promise<SubtypeGroupOption[]> {
  const locales = Array.from(new Set([locale, FALLBACK_LOCALE]));
  const { data, error } = await supabase
    .from('service_subtype_groups')
    .select(
      'id, slug, is_active, service_subtype_group_translations(locale, name)'
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error || !data) return [];

  return data.map((row) => {
    const trans =
      (row.service_subtype_group_translations as unknown as {
        locale: string;
        name: string;
      }[]) ?? [];
    const pick = (l: string) => trans.find((t) => t.locale === l)?.name;
    const name = pick(locale) ?? pick(FALLBACK_LOCALE) ?? row.slug;
    return { slug: row.slug as string, name };
  }).filter((g) =>
    // drop groups whose translations array is empty of either locale
    locales.includes(locale) ? true : true
  );
}

export type SubtypeOption = {
  id: string;
  name: string;
};

// Carga los subtypes de un grupo para enriquecer field.options/option_labels
// al resolver un field con persistence_type='subtype'. El render usa
// input_type='multiselect_checkbox' o 'multiselect_dropdown'; los values
// son los subtype_ids de DB.
export async function loadSubtypeOptionsForGroup(
  supabase: Sb,
  groupSlug: string,
  locale: string
): Promise<SubtypeOption[]> {
  const { data: group, error: gErr } = await supabase
    .from('service_subtype_groups')
    .select('id')
    .eq('slug', groupSlug)
    .maybeSingle();
  if (gErr || !group) return [];

  const { data, error } = await supabase
    .from('service_subtypes')
    .select(
      'id, slug, is_active, service_subtype_translations(locale, name)'
    )
    .eq('group_id', group.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error || !data) return [];

  return data.map((row) => {
    const trans =
      (row.service_subtype_translations as unknown as {
        locale: string;
        name: string;
      }[]) ?? [];
    const pick = (l: string) => trans.find((t) => t.locale === l)?.name;
    const name = pick(locale) ?? pick(FALLBACK_LOCALE) ?? row.slug;
    return { id: row.id as string, name };
  });
}
