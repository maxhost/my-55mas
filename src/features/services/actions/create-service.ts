'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceSchema, type CreateServiceInput } from '../schemas';

export async function createService(input: CreateServiceInput) {
  const parsed = createServiceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { slug, translation } = parsed.data;
  const supabase = createClient();

  // Create service
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .insert({ slug })
    .select('id')
    .single();

  if (serviceError) {
    if (serviceError.code === '23505') {
      return { error: { slug: ['Slug already exists'] } };
    }
    throw serviceError;
  }

  // Create initial translation
  const { error: translationError } = await supabase
    .from('service_translations')
    .insert({
      service_id: service.id,
      locale: translation.locale,
      name: translation.name,
      description: translation.description || null,
      includes: translation.includes || null,
      hero_title: translation.hero_title || null,
      hero_subtitle: translation.hero_subtitle || null,
      benefits: translation.benefits,
      guarantees: translation.guarantees,
      faqs: translation.faqs,
    });

  if (translationError) throw translationError;

  revalidatePath('/[locale]/(admin)/admin/services', 'layout');
  return { data: { id: service.id } };
}
