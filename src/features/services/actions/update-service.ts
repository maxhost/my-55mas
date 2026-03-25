'use server';

import { createClient } from '@/lib/supabase/server';
import {
  updateServiceSchema,
  type UpdateServiceInput,
  saveTranslationSchema,
  type SaveTranslationInput,
  saveConfigSchema,
  type SaveConfigInput,
} from '../schemas';

export async function updateService(input: UpdateServiceInput) {
  const parsed = updateServiceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { id, ...fields } = parsed.data;
  const supabase = createClient();

  const { error } = await supabase
    .from('services')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      return { error: { slug: ['Slug already exists'] } };
    }
    throw error;
  }

  return { data: { id } };
}

export async function saveTranslation(input: SaveTranslationInput) {
  const parsed = saveTranslationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { service_id, translation } = parsed.data;
  const supabase = createClient();

  const { error } = await supabase.from('service_translations').upsert(
    {
      service_id,
      locale: translation.locale,
      name: translation.name,
      description: translation.description || null,
      includes: translation.includes || null,
      hero_title: translation.hero_title || null,
      hero_subtitle: translation.hero_subtitle || null,
      benefits: translation.benefits,
      guarantees: translation.guarantees,
      faqs: translation.faqs,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'service_id,locale' }
  );

  if (error) throw error;

  return { data: { service_id, locale: translation.locale } };
}

export async function saveConfig(input: SaveConfigInput) {
  const parsed = saveConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { service_id, status, allows_recurrence, countries } = parsed.data;
  const supabase = createClient();

  // Update service fields if provided
  const serviceUpdate: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (status !== undefined) serviceUpdate.status = status;
  if (allows_recurrence !== undefined)
    serviceUpdate.allows_recurrence = allows_recurrence;

  const { error: serviceError } = await supabase
    .from('services')
    .update(serviceUpdate)
    .eq('id', service_id);

  if (serviceError) throw serviceError;

  // Delete existing country prices, then insert new ones
  const { error: deleteError } = await supabase
    .from('service_countries')
    .delete()
    .eq('service_id', service_id);

  if (deleteError) throw deleteError;

  if (countries.length > 0) {
    const rows = countries.map((c) => ({
      service_id,
      country_id: c.country_id,
      base_price: c.base_price,
      is_active: c.is_active,
    }));

    const { error: insertError } = await supabase
      .from('service_countries')
      .insert(rows);

    if (insertError) throw insertError;
  }

  return { data: { service_id } };
}
