'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { addOrderActivityNoteSchema } from '../schemas';
import type { OrderActivityNote } from '../types';

type Result = { data: OrderActivityNote } | { error: { message: string } };

export async function addOrderActivityNote(input: unknown): Promise<Result> {
  const supabase = createClient();
  const parsed = addOrderActivityNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { orderId, body } = parsed.data;

  const { data: auth } = await supabase.auth.getUser();
  const authorId = auth.user?.id ?? null;

  const { data: inserted, error } = await supabase
    .from('order_notes')
    .insert({
      order_id: orderId,
      author_id: authorId,
      body,
      is_system: false,
    })
    .select('id, body, is_system, author_id, created_at')
    .single();
  if (error || !inserted) {
    return { error: { message: error?.message ?? 'Failed to create note' } };
  }

  const { data: profile } = authorId
    ? await supabase.from('profiles').select('full_name').eq('id', authorId).maybeSingle()
    : { data: null };

  revalidatePath('/[locale]/(admin)/admin/orders/[id]', 'page');
  return {
    data: {
      id: inserted.id,
      body: inserted.body,
      is_system: inserted.is_system,
      author_id: inserted.author_id,
      author_name: profile?.full_name ?? null,
      created_at: inserted.created_at,
    },
  };
}
