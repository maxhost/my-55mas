'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createRegistrationFormSchema } from '../schemas';
import { sanitizeKey } from '@/shared/lib/forms/utils';

/**
 * Creates a new General registration form with auto-generated slug.
 * Handles duplicate slugs by appending _2, _3, etc.
 */
export async function createRegistrationForm(
  name: string
): Promise<{ id: string } | { error: Record<string, string[]> }> {
  const parsed = createRegistrationFormSchema.safeParse({ name });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = createClient();
  let slug = sanitizeKey(parsed.data.name);
  if (!slug) slug = 'form';

  // Check for duplicate slugs and append suffix
  const { data: existing } = await supabase
    .from('registration_forms')
    .select('slug')
    .is('city_id', null)
    .is('parent_id', null);

  const existingSlugs = new Set((existing ?? []).map((e) => e.slug));
  let finalSlug = slug;
  let counter = 2;
  while (existingSlugs.has(finalSlug)) {
    finalSlug = `${slug}_${counter}`;
    counter++;
  }

  const { data: newForm, error } = await supabase
    .from('registration_forms')
    .insert({
      slug: finalSlug,
      name: parsed.data.name,
    })
    .select('id')
    .single();

  if (error) return { error: { _db: [error.message] } };

  revalidatePath('/[locale]/(admin)/admin/talent-registration', 'layout');
  return { id: newForm.id };
}
