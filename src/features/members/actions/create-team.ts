'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createTeamSchema } from '../schemas';
import type { CreateTeamInput } from '../schemas';

type Result = { success: true; id: string } | { error: Record<string, string[]> };

export async function createTeam(input: CreateTeamInput): Promise<Result> {
  const parsed = createTeamSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: team, error } = await supabase
    .from('teams')
    .insert({ name: parsed.data.name, created_by: user?.id ?? null })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: { name: ['Team name already exists'] } };
    }
    return { error: { _server: [error.message] } };
  }

  revalidatePath('/[locale]/(admin)/admin/members', 'layout');
  return { success: true, id: team.id };
}
