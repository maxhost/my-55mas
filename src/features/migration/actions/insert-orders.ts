'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import type { BatchResult, RowError } from '../types';
import type { TransformedOrder } from '../lib/transformers/transform-orders';

/**
 * Row-by-row upsert keyed on legacy_id for idempotent CSV re-runs.
 * A single failing row (CHECK violation, FK mismatch, …) becomes a RowError
 * instead of rolling back the entire batch.
 */
export async function insertOrders(
  rows: TransformedOrder[],
  startIndex: number
): Promise<BatchResult> {
  const admin = createAdminClient();
  let inserted = 0;
  const errors: RowError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const rowIndex = startIndex + i;
    const row = rows[i];

    try {
      const { error } = row.legacy_id
        ? await admin
            .from('orders')
            .upsert(row, { onConflict: 'legacy_id', ignoreDuplicates: false })
        : await admin.from('orders').insert(row);

      if (error) {
        errors.push({ rowIndex, message: error.message });
        continue;
      }
      inserted++;
    } catch (err) {
      errors.push({
        rowIndex,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return { inserted, errors };
}
