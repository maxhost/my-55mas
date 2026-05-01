'use server';

import { createClient } from '@/lib/supabase/server';
import type { FiscalIdTypeWithDetails } from '../types';

type I18nLabelRecord = Record<string, { label?: string } | null> | null;

function flattenLabels(i18n: I18nLabelRecord): Record<string, string> {
  const out: Record<string, string> = {};
  if (!i18n) return out;
  for (const [locale, entry] of Object.entries(i18n)) {
    const l = entry?.label;
    if (typeof l === 'string') out[locale] = l;
  }
  return out;
}

export async function listFiscalIdTypes(): Promise<FiscalIdTypeWithDetails[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('fiscal_id_types')
    .select('id, code, sort_order, is_active, i18n, fiscal_id_type_countries(country_id)')
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const junction = (row.fiscal_id_type_countries ?? []) as { country_id: string }[];
    return {
      id: row.id,
      code: row.code,
      sort_order: row.sort_order,
      is_active: row.is_active,
      translations: flattenLabels(row.i18n as I18nLabelRecord),
      country_ids: junction.map((j) => j.country_id),
    };
  });
}
