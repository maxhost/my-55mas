'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { saveRegistrationConfigSchema } from '../schemas';
import type { SaveRegistrationConfigInput } from '../types';

/**
 * Saves the country/city configuration for a registration form (full replace).
 * form_id must be the General form's ID.
 */
export async function saveRegistrationConfig(input: SaveRegistrationConfigInput) {
  const parsed = saveRegistrationConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { form_id, country_ids, city_ids } = parsed.data;
  const supabase = createClient();

  // Full replace countries
  const { error: delCountries } = await supabase
    .from('registration_form_countries')
    .delete()
    .eq('form_id', form_id);
  if (delCountries) return { error: { _db: [delCountries.message] } };

  if (country_ids.length > 0) {
    const rows = country_ids.map((country_id) => ({ form_id, country_id }));
    const { error } = await supabase.from('registration_form_countries').insert(rows);
    if (error) return { error: { _db: [error.message] } };
  }

  // Full replace cities
  const { error: delCities } = await supabase
    .from('registration_form_cities')
    .delete()
    .eq('form_id', form_id);
  if (delCities) return { error: { _db: [delCities.message] } };

  if (city_ids.length > 0) {
    const rows = city_ids.map((city_id) => ({ form_id, city_id }));
    const { error } = await supabase.from('registration_form_cities').insert(rows);
    if (error) return { error: { _db: [error.message] } };
  }

  revalidatePath('/[locale]/(admin)/admin/talent-registration', 'layout');
  return { data: true };
}
