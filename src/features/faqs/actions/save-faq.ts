'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { saveFaqSchema } from '../schemas';
import type { SaveFaqInput } from '../types';

type SaveFaqResult =
  | { data: { id: string } }
  | { error: Record<string, string[]> };

export async function saveFaq(input: SaveFaqInput): Promise<SaveFaqResult> {
  const parsed = saveFaqSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { faq } = parsed.data;
  const supabase = createClient();

  const i18n = faq.translations as unknown as Json;

  let faqId: string;

  if (faq.id) {
    const { error } = await supabase
      .from('faqs')
      .update({
        sort_order: faq.sort_order,
        is_active: faq.is_active,
        i18n,
      })
      .eq('id', faq.id);
    if (error) return { error: { _db: [error.message] } };
    faqId = faq.id;
  } else {
    const { data, error } = await supabase
      .from('faqs')
      .insert({
        sort_order: faq.sort_order,
        is_active: faq.is_active,
        i18n,
      })
      .select('id')
      .single();
    if (error) return { error: { _db: [error.message] } };
    faqId = data.id;
  }

  revalidatePath('/[locale]/(admin)/admin/faq', 'layout');
  return { data: { id: faqId } };
}
