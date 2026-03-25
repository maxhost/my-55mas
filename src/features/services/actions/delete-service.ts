'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const deleteServiceSchema = z.object({
  id: z.string().uuid(),
});

export async function deleteService(id: string) {
  const parsed = deleteServiceSchema.safeParse({ id });
  if (!parsed.success) return { error: { _validation: ['Invalid service ID'] } };

  const supabase = createClient();
  const { error } = await supabase.rpc('delete_service', {
    p_service_id: parsed.data.id,
  });

  if (error) return { error: { _db: [error.message] } };

  return { data: { id: parsed.data.id } };
}
