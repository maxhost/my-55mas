'use server';

import { createClient } from '@/lib/supabase/server';
import type { OrderActivityNote } from '../types';

export async function getOrderActivity(orderId: string): Promise<OrderActivityNote[]> {
  const supabase = createClient();

  const { data: notes } = await supabase
    .from('order_notes')
    .select('id, body, is_system, author_id, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  if (!notes || notes.length === 0) return [];

  const authorIds = Array.from(
    new Set(notes.map((n) => n.author_id).filter((id): id is string => !!id)),
  );
  const authorById = new Map<string, string | null>();
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', authorIds);
    for (const p of profiles ?? []) authorById.set(p.id, p.full_name);
  }

  return notes.map((n) => ({
    id: n.id,
    body: n.body,
    is_system: n.is_system,
    author_id: n.author_id,
    author_name: n.author_id ? authorById.get(n.author_id) ?? null : null,
    created_at: n.created_at,
  }));
}
