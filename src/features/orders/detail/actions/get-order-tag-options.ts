'use server';

import type { OrderTagOption } from '../types';

/**
 * Phase 1 — MOCK. Phase 2 will query `order_tags` table (analogous to
 * `talent_tags`).
 */
export async function getOrderTagOptions(_locale: string): Promise<OrderTagOption[]> {
  return [
    { id: 'mock-tag-1', name: 'Urgente' },
    { id: 'mock-tag-2', name: 'Cliente VIP' },
    { id: 'mock-tag-3', name: 'Repetido' },
    { id: 'mock-tag-4', name: 'Difícil acceso' },
  ];
}
