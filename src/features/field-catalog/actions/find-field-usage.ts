'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import type { FieldUsage, FindFieldUsageResult } from '../types';
import { extractFieldIds } from './find-field-usage-helpers';

export async function findFieldUsage(
  fieldDefinitionId: string
): Promise<FindFieldUsageResult> {
  const supabase = createAdminClient();

  const [regRes, talRes] = await Promise.all([
    supabase.from('registration_forms').select('id, schema, city_id'),
    supabase.from('talent_forms').select('id, schema, city_id, service_id'),
  ]);

  if (regRes.error) return { ok: false, error: regRes.error.message };
  if (talRes.error) return { ok: false, error: talRes.error.message };

  const usage: FieldUsage[] = [];

  for (const row of regRes.data ?? []) {
    if (extractFieldIds(row.schema).has(fieldDefinitionId)) {
      usage.push({
        form_id: row.id,
        form_type: 'registration',
        city_id: row.city_id,
        service_id: null,
      });
    }
  }

  for (const row of talRes.data ?? []) {
    if (extractFieldIds(row.schema).has(fieldDefinitionId)) {
      usage.push({
        form_id: row.id,
        form_type: 'talent',
        city_id: row.city_id,
        service_id: row.service_id,
      });
    }
  }

  return { ok: true, data: usage };
}
