'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { saveQuestionsSchema } from '../schemas';
import type { SaveQuestionsInput } from '@/shared/lib/questions/types';

type Result = { data: { id: string } } | { error: Record<string, string[]> };

export async function saveServiceQuestions(input: SaveQuestionsInput): Promise<Result> {
  const parsed = saveQuestionsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { serviceId, questions } = parsed.data;
  const supabase = createClient();

  const { error } = await supabase
    .from('services')
    .update({ questions: questions as unknown as Json })
    .eq('id', serviceId);

  if (error) return { error: { _db: [error.message] } };

  revalidatePath(`/[locale]/(admin)/admin/services/${serviceId}`, 'page');
  return { data: { id: serviceId } };
}
