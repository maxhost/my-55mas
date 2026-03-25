'use server';

import { createClient } from '@/lib/supabase/server';

export async function archiveService(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('services')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;

  return { data: { id } };
}
