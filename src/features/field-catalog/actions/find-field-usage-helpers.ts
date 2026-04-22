type FormSchemaShape = {
  steps?: Array<{ field_refs?: Array<{ field_definition_id?: string }> }>;
};

// Extrae todos los field_definition_id referenciados en un schema jsonb.
// Tolera cualquier estructura — solo busca el camino steps[].field_refs[].
export function extractFieldIds(schema: unknown): Set<string> {
  const ids = new Set<string>();
  const shape = schema as FormSchemaShape | null;
  if (!shape || !Array.isArray(shape.steps)) return ids;
  for (const step of shape.steps) {
    if (!Array.isArray(step?.field_refs)) continue;
    for (const ref of step.field_refs) {
      if (typeof ref?.field_definition_id === 'string') {
        ids.add(ref.field_definition_id);
      }
    }
  }
  return ids;
}
