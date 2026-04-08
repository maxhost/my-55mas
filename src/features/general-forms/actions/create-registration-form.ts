'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createRegistrationFormSchema } from '../schemas';

/**
 * Creates a new General registration form with explicit slug.
 * Handles duplicate slug error (UNIQUE constraint 23505).
 */
export async function createRegistrationForm(
  input: { name: string; slug: string; target_role?: 'talent' | 'client' }
): Promise<{ id: string } | { error: Record<string, string[]> }> {
  const parsed = createRegistrationFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = createClient();

  const { data: newForm, error } = await supabase
    .from('registration_forms')
    .insert({
      slug: parsed.data.slug,
      name: parsed.data.name,
      target_role: parsed.data.target_role,
    })
    .select('id')
    .single();

  if (error) {
    // Duplicate slug (UNIQUE constraint violation)
    if (error.code === '23505') {
      return { error: { slug: ['Este slug ya está en uso'] } };
    }
    return { error: { _db: [error.message] } };
  }

  revalidatePath('/[locale]/(admin)/admin/forms', 'layout');
  return { id: newForm.id };
}
