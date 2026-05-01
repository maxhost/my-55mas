'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { saveI18nSchema } from '../schemas';
import type { SaveI18nInput } from '../types';

type Result = { data: { id: string } } | { error: Record<string, string[]> };

export async function saveFormDefinitionI18n(input: SaveI18nInput): Promise<Result> {
  const parsed = saveI18nSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { formId, i18n } = parsed.data;
  const supabase = createClient();

  const { error } = await supabase
    .from('form_definitions')
    .update({ i18n: i18n as unknown as Json })
    .eq('id', formId);

  if (error) return { error: { _db: [error.message] } };

  revalidatePath('/[locale]/(admin)/admin/form-definitions', 'layout');
  return { data: { id: formId } };
}
