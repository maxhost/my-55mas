'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { createServiceSchema, type CreateServiceInput } from '../schemas';

export async function createService(input: CreateServiceInput) {
  const parsed = createServiceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { slug, translation } = parsed.data;
  const supabase = createClient();

  const initialEntry: Record<string, unknown> = {
    name: translation.name,
  };
  if (translation.description) initialEntry.description = translation.description;
  if (translation.includes) initialEntry.includes = translation.includes;
  if (translation.hero_title) initialEntry.hero_title = translation.hero_title;
  if (translation.hero_subtitle) initialEntry.hero_subtitle = translation.hero_subtitle;
  if (translation.benefits.length) initialEntry.benefits = translation.benefits;
  if (translation.guarantees.length) initialEntry.guarantees = translation.guarantees;
  if (translation.faqs.length) initialEntry.faqs = translation.faqs;

  const { data: service, error: serviceError } = await supabase
    .from('services')
    .insert({
      slug,
      i18n: { [translation.locale]: initialEntry } as unknown as Json,
    })
    .select('id')
    .single();

  if (serviceError) {
    if (serviceError.code === '23505') {
      return { error: { slug: ['Slug already exists'] } };
    }
    throw serviceError;
  }

  revalidatePath('/[locale]/(admin)/admin/services', 'layout');
  return { data: { id: service.id } };
}
