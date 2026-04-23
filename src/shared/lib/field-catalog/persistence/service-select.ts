import {
  PersistenceError,
  resolveTalentProfileId,
  type Sb,
} from './context';

// Contexto adicional requerido para service_select:
// el country_id del talent (o del flow) ya que talent_services.PK es (talent_id, service_id, country_id).
export type ServiceSelectContext = {
  country_id: string;
};

export async function readServiceSelect(
  supabase: Sb,
  userId: string
): Promise<string[]> {
  const talentId = await resolveTalentProfileId(supabase, userId);
  if (!talentId) return [];
  const { data, error } = await supabase
    .from('talent_services')
    .select('service_id')
    .eq('talent_id', talentId);
  if (error) {
    throw new PersistenceError(
      `read talent_services failed: ${error.message}`,
      'read_failed'
    );
  }
  return (data ?? []).map((row) => row.service_id);
}

// Sync: delete existing talent_services del user (en ese country) + insert new.
// talent_services.talent_id FK apunta a talent_profiles.id (NO auth.users.id),
// por lo que resolvemos el talent_profiles.id del user antes de escribir.
export async function writeServiceSelect(
  supabase: Sb,
  userId: string,
  serviceIds: string[],
  context: ServiceSelectContext
): Promise<void> {
  if (!context?.country_id) {
    throw new PersistenceError(
      'service_select write requires country_id in context',
      'missing_context'
    );
  }
  const talentId = await resolveTalentProfileId(supabase, userId);
  if (!talentId) {
    throw new PersistenceError(
      `service_select write requires talent_profiles row for user ${userId}`,
      'missing_context'
    );
  }
  const { error: delError } = await supabase
    .from('talent_services')
    .delete()
    .eq('talent_id', talentId)
    .eq('country_id', context.country_id);
  if (delError) {
    throw new PersistenceError(
      `delete talent_services failed: ${delError.message}`,
      'write_failed'
    );
  }
  if (serviceIds.length === 0) return;
  const rows = serviceIds.map((service_id) => ({
    talent_id: talentId,
    service_id,
    country_id: context.country_id,
    is_verified: false,
  }));
  const { error: insError } = await supabase.from('talent_services').insert(rows);
  if (insError) {
    throw new PersistenceError(
      `insert talent_services failed: ${insError.message}`,
      'write_failed'
    );
  }
}
