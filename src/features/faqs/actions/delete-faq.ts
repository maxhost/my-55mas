'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type DeleteFaqResult =
  | { data: { id: string } }
  | { error: Record<string, string[]> };

export async function deleteFaq(id: string): Promise<DeleteFaqResult> {
  if (!id) return { error: { id: ['id is required'] } };

  const supabase = createClient();
  const { error } = await supabase.from('faqs').delete().eq('id', id);
  if (error) return { error: { _db: [error.message] } };

  revalidatePath('/[locale]/(admin)/admin/faq', 'layout');
  return { data: { id } };
}
