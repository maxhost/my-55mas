'use server';

import { createClient } from '@/lib/supabase/server';
import { getRegistrationForm } from './get-registration-form';
import type { RegistrationFormWithTranslations } from '../types';
import type { EmbedReason } from '@/shared/lib/embed/types';

// Reasons que este loader puede devolver. Subset de EmbedReason (los que
// aplican al universo de general forms — sin auth/talent gates).
export type GeneralFormEmbedReason = Extract<
  EmbedReason,
  'unknown-slug' | 'city-not-configured' | 'no-active-form'
>;

export type EmbeddableFormResult =
  | { available: true; form: RegistrationFormWithTranslations }
  | { available: false; reason: GeneralFormEmbedReason };

/**
 * Canonical action for loading a registration form for embedding.
 * Checks city availability via registration_form_cities, then loads
 * the form with fallback to General if no city variant exists.
 *
 * Reasons:
 * - 'unknown-slug': no general form en DB para ese slug.
 * - 'city-not-configured': el form existe pero la city no está habilitada.
 * - 'no-active-form': la city está habilitada pero no hay form activo (ej: desactivado).
 */
export async function getEmbeddableForm(
  slug: string,
  cityId: string
): Promise<EmbeddableFormResult> {
  const supabase = createClient();

  // 1. Find General form by slug to get form_id
  const { data: generalForm } = await supabase
    .from('registration_forms')
    .select('id')
    .eq('slug', slug)
    .is('city_id', null)
    .is('parent_id', null)
    .single();

  if (!generalForm) return { available: false, reason: 'unknown-slug' };

  // 2. Check if city is configured as available
  const { data: cityConfig } = await supabase
    .from('registration_form_cities')
    .select('city_id')
    .eq('form_id', generalForm.id)
    .eq('city_id', cityId)
    .limit(1)
    .maybeSingle();

  if (!cityConfig) return { available: false, reason: 'city-not-configured' };

  // 3. Load form with fallback to General
  const form = await getRegistrationForm(slug, cityId, true);
  if (!form) return { available: false, reason: 'no-active-form' };

  return { available: true, form };
}
