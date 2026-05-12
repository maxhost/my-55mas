'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';

export type FiscalIdTypeOption = {
  id: string;
  code: string;
  label: string;
};

type I18nRecord = Record<string, Record<string, unknown>> | null;

/**
 * Returns the list of active fiscal_id_types ordered by sort_order then code,
 * each with a label resolved for the given locale (falling back to code when
 * the locale entry is missing).
 */
export async function listFiscalIdTypes(locale: string): Promise<FiscalIdTypeOption[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('fiscal_id_types')
    .select('id, code, i18n, sort_order')
    .eq('is_active', true)
    .order('sort_order')
    .order('code');

  return (data ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    label:
      localizedField(row.i18n as I18nRecord, locale, 'label') ??
      localizedField(row.i18n as I18nRecord, locale, 'name') ??
      row.code,
  }));
}
