import type { SubtypeTarget } from '../types';
import { PersistenceError, type Sb } from './context';

// Resuelve slug del grupo → lista de subtype_ids que pertenecen al grupo.
async function loadGroupSubtypeIds(
  supabase: Sb,
  subtypeGroupSlug: string
): Promise<string[]> {
  const { data: group, error: gErr } = await supabase
    .from('service_subtype_groups')
    .select('id')
    .eq('slug', subtypeGroupSlug)
    .maybeSingle();
  if (gErr) {
    throw new PersistenceError(
      `read service_subtype_groups failed: ${gErr.message}`,
      'read_failed'
    );
  }
  if (!group) {
    throw new PersistenceError(
      `subtype_group "${subtypeGroupSlug}" not found`,
      'missing_context'
    );
  }
  const { data: subtypes, error: sErr } = await supabase
    .from('service_subtypes')
    .select('id')
    .eq('group_id', group.id);
  if (sErr) {
    throw new PersistenceError(
      `read service_subtypes failed: ${sErr.message}`,
      'read_failed'
    );
  }
  return (subtypes ?? []).map((r) => r.id);
}

export async function readSubtype(
  supabase: Sb,
  userId: string,
  target: SubtypeTarget
): Promise<string[]> {
  const groupSubtypeIds = await loadGroupSubtypeIds(supabase, target.subtype_group);
  if (groupSubtypeIds.length === 0) return [];
  const { data, error } = await supabase
    .from('talent_service_subtypes')
    .select('subtype_id')
    .eq('talent_id', userId)
    .in('subtype_id', groupSubtypeIds);
  if (error) {
    throw new PersistenceError(
      `read talent_service_subtypes failed: ${error.message}`,
      'read_failed'
    );
  }
  return (data ?? []).map((r) => r.subtype_id);
}

// Sync dentro del grupo: delete solo subtypes del grupo + insert nuevos.
// Otros grupos (del mismo talent) quedan intactos.
export async function writeSubtype(
  supabase: Sb,
  userId: string,
  subtypeIds: string[],
  target: SubtypeTarget
): Promise<void> {
  const groupSubtypeIds = await loadGroupSubtypeIds(supabase, target.subtype_group);
  if (groupSubtypeIds.length > 0) {
    const { error: delError } = await supabase
      .from('talent_service_subtypes')
      .delete()
      .eq('talent_id', userId)
      .in('subtype_id', groupSubtypeIds);
    if (delError) {
      throw new PersistenceError(
        `delete talent_service_subtypes failed: ${delError.message}`,
        'write_failed'
      );
    }
  }
  if (subtypeIds.length === 0) return;
  const rows = subtypeIds.map((subtype_id) => ({ talent_id: userId, subtype_id }));
  const { error: insError } = await supabase
    .from('talent_service_subtypes')
    .insert(rows);
  if (insError) {
    throw new PersistenceError(
      `insert talent_service_subtypes failed: ${insError.message}`,
      'write_failed'
    );
  }
}
