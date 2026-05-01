'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { saveFiscalIdTypeSchema } from '../schemas';
import type { SaveFiscalIdTypeInput } from '../types';

type SaveResult = { data: { id: string } } | { error: Record<string, string[]> };

export async function saveFiscalIdType(input: SaveFiscalIdTypeInput): Promise<SaveResult> {
  const parsed = saveFiscalIdTypeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { fiscalIdType: t } = parsed.data;
  const supabase = createClient();

  const i18n = Object.fromEntries(
    Object.entries(t.translations).map(([locale, label]) => [locale, { label }])
  ) as unknown as Json;

  let typeId: string;

  if (t.id) {
    const { error } = await supabase
      .from('fiscal_id_types')
      .update({ code: t.code, sort_order: t.sort_order, is_active: t.is_active, i18n })
      .eq('id', t.id);
    if (error) return { error: { _db: [error.message] } };
    typeId = t.id;
  } else {
    const { data, error } = await supabase
      .from('fiscal_id_types')
      .insert({ code: t.code, sort_order: t.sort_order, is_active: t.is_active, i18n })
      .select('id')
      .single();
    if (error) return { error: { _db: [error.message] } };
    typeId = data.id;
  }

  const { error: deleteError } = await supabase
    .from('fiscal_id_type_countries')
    .delete()
    .eq('fiscal_id_type_id', typeId);
  if (deleteError) return { error: { _db: [deleteError.message] } };

  if (t.country_ids.length > 0) {
    const rows = t.country_ids.map((country_id) => ({
      fiscal_id_type_id: typeId,
      country_id,
    }));
    const { error: insertError } = await supabase.from('fiscal_id_type_countries').insert(rows);
    if (insertError) return { error: { _db: [insertError.message] } };
  }

  revalidatePath('/[locale]/(admin)/admin/fiscal-id-types', 'layout');
  return { data: { id: typeId } };
}
