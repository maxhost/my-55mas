import { PersistenceError, type Sb } from './context';

export async function readFormResponse(
  supabase: Sb,
  userId: string,
  fieldDefinitionId: string
): Promise<unknown> {
  const { data, error } = await supabase
    .from('user_form_responses')
    .select('value')
    .eq('user_id', userId)
    .eq('field_definition_id', fieldDefinitionId)
    .maybeSingle();
  if (error) {
    throw new PersistenceError(
      `read user_form_responses failed: ${error.message}`,
      'read_failed'
    );
  }
  return data?.value ?? undefined;
}

export async function writeFormResponse(
  supabase: Sb,
  userId: string,
  fieldDefinitionId: string,
  value: unknown
): Promise<void> {
  const { error } = await supabase
    .from('user_form_responses')
    .upsert(
      {
        user_id: userId,
        field_definition_id: fieldDefinitionId,
        value: value as never,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,field_definition_id' }
    );
  if (error) {
    throw new PersistenceError(
      `upsert user_form_responses failed: ${error.message}`,
      'write_failed'
    );
  }
}
