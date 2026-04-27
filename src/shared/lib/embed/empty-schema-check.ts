import type { ResolvedForm } from '@/shared/lib/field-catalog/resolved-types';

// Detecta forms que resolvieron a algo válido estructuralmente pero sin
// fields renderizables. Embedders deben recibir un mensaje claro en vez
// de un submit vacío.
export function isEmptySchema(form: ResolvedForm): boolean {
  if (!form.steps || form.steps.length === 0) return true;
  return form.steps.every(
    (step) => !step.fields || step.fields.length === 0
  );
}

// Detecta schemas que NO son CatalogFormSchema. Forms viejos pueden tener
// FormField[] inline en cada step (pre-catálogo). resolveFormFromJson hoy
// retorna { steps: [] } para esos casos, lo que es indistinguible de un
// form recién creado vacío. Acá detectamos la forma original del JSON
// antes de pasarlo al resolver.
export function isLegacySchema(rawJson: unknown): boolean {
  if (rawJson === null || rawJson === undefined) return true;
  if (typeof rawJson !== 'object') return true;
  const obj = rawJson as Record<string, unknown>;
  if (!('steps' in obj)) return true;
  if (!Array.isArray(obj.steps)) return true;
  // Cada step debe tener field_refs (CatalogFormSchema). Si tiene fields
  // pero no field_refs → es schema legacy con FormField[] inline.
  for (const step of obj.steps) {
    if (step === null || typeof step !== 'object') return true;
    const s = step as Record<string, unknown>;
    if (!('field_refs' in s)) return true;
  }
  return false;
}
