'use server';

import { createClient } from '@/lib/supabase/server';
import type { TalentNote } from '../types';

export async function getTalentNotes(talentId: string): Promise<TalentNote[]> {
  const supabase = createClient();

  const { data: notes } = await supabase
    .from('talent_notes')
    .select('id, body, is_system, pinned, author_id, created_at')
    .eq('talent_id', talentId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (!notes || notes.length === 0) return [];

  const authorIds = Array.from(
    new Set(notes.map((n) => n.author_id).filter((id): id is string => !!id)),
  );
  const { data: authors } = authorIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', authorIds)
    : { data: [] };
  const authorMap = new Map<string, string>(
    (authors ?? []).map((a) => [a.id, a.full_name ?? '']),
  );

  return notes.map((n) => ({
    id: n.id,
    body: n.body,
    is_system: n.is_system,
    pinned: n.pinned,
    author_id: n.author_id,
    author_name: n.author_id ? authorMap.get(n.author_id) ?? null : null,
    created_at: n.created_at,
  }));
}
