'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import {
  updateServiceSchema,
  type UpdateServiceInput,
  saveTranslationSchema,
  type SaveTranslationInput,
  saveConfigSchema,
  type SaveConfigInput,
} from '../schemas';
import { canPublish } from './config-helpers';

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

  revalidatePath('/[locale]/(admin)/admin/services', 'layout');
  return { data: { id } };
}

export async function saveTranslation(input: SaveTranslationInput) {
  const parsed = saveTranslationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { service_id, translation } = parsed.data;
  const supabase = createClient();

  // Read current i18n, merge in the new locale entry, write back. Preserves
  // other locales atomically (single UPDATE).
  const { data: row, error: readError } = await supabase
    .from('services')
    .select('i18n')
    .eq('id', service_id)
    .single();

  if (readError) throw readError;

  const entry: Record<string, unknown> = { name: translation.name };
  if (translation.description) entry.description = translation.description;
  if (translation.includes) entry.includes = translation.includes;
  if (translation.hero_title) entry.hero_title = translation.hero_title;
  if (translation.hero_subtitle) entry.hero_subtitle = translation.hero_subtitle;
  if (translation.benefits.length) entry.benefits = translation.benefits;
  if (translation.guarantees.length) entry.guarantees = translation.guarantees;
  if (translation.faqs.length) entry.faqs = translation.faqs;

  const currentI18n = (row?.i18n ?? {}) as Record<string, unknown>;
  const nextI18n = { ...currentI18n, [translation.locale]: entry };

  const { error } = await supabase
    .from('services')
    .update({ i18n: nextI18n as unknown as Json, updated_at: new Date().toISOString() })
    .eq('id', service_id);

  if (error) throw error;

  revalidatePath('/[locale]/(admin)/admin/services', 'layout');
  return { data: { service_id, locale: translation.locale } };
}

export async function saveConfig(input: SaveConfigInput) {
  const parsed = saveConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { service_id, status, allows_recurrence, countries, cities } = parsed.data;

  // Validate publish requirements
  if (status === 'published' && !canPublish(cities)) {
    return { error: { status: ['Requires at least 1 active city with price > 0'] } };
  }

  const supabase = createClient();

  // Atomic save via RPC (transactional: countries + cities together)
  const { error } = await supabase.rpc('save_service_config', {
    p_service_id: service_id,
    p_status: status ?? undefined,
    p_allows_recurrence: allows_recurrence ?? undefined,
    p_countries: countries as unknown as Json,
    p_cities: cities.map((c) => ({
      city_id: c.city_id,
      base_price: c.base_price,
      is_active: c.is_active,
    })) as unknown as Json,
  });

  if (error) return { error: { _rpc: [error.message] } };

  revalidatePath('/[locale]/(admin)/admin/services', 'layout');
  return { data: { service_id } };
}
