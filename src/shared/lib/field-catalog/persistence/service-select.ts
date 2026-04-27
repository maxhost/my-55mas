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

// Sync diff-based:
// 1. Lee current rows de talent_services para (talent_id, country_id).
// 2. Calcula toAdd = newSet - currentSet, toRemove = currentSet - newSet.
// 3. Insert solo toAdd, delete solo toRemove (filtrado por service_id IN toRemove).
//
// Idempotency: si la nueva selección es idéntica a la actual, no toca DB.
// Esto preserva form_data, form_id, unit_price, specializations de los
// rows existentes — clave para la UX del onboarding step 3 donde el user
// re-commitea sin querer destruir su configuración.
//
// Re-elección destructiva: cuando un servicio sale de la selección, su
// row se borra (cascade lleva talent_service_subtypes vinculados).
// Esto es intencional — la UX confirmada acepta perder form_data del
// servicio sacado.
//
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

  // 1. Read current rows scoped a este (talent, country).
  const { data: currentData, error: readError } = await supabase
    .from('talent_services')
    .select('service_id')
    .eq('talent_id', talentId)
    .eq('country_id', context.country_id);
  if (readError) {
    throw new PersistenceError(
      `read talent_services failed: ${readError.message}`,
      'read_failed'
    );
  }
  const currentIds = new Set((currentData ?? []).map((r) => r.service_id));
  const newIds = new Set(serviceIds);

  // 2. Diff.
  const toRemove = Array.from(currentIds).filter((id) => !newIds.has(id));
  const toAdd = Array.from(newIds).filter((id) => !currentIds.has(id));

  // 3a. Delete sólo los removidos.
  if (toRemove.length > 0) {
    const { error: delError } = await supabase
      .from('talent_services')
      .delete()
      .eq('talent_id', talentId)
      .eq('country_id', context.country_id)
      .in('service_id', toRemove);
    if (delError) {
      throw new PersistenceError(
        `delete talent_services failed: ${delError.message}`,
        'write_failed'
      );
    }
  }

  // 3b. Insert sólo los nuevos.
  if (toAdd.length > 0) {
    const rows = toAdd.map((service_id) => ({
      talent_id: talentId,
      service_id,
      country_id: context.country_id,
      is_verified: false,
    }));
    const { error: insError } = await supabase
      .from('talent_services')
      .insert(rows);
    if (insError) {
      throw new PersistenceError(
        `insert talent_services failed: ${insError.message}`,
        'write_failed'
      );
    }
  }
}
