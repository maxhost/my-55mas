import type { ResolvedField } from '@/shared/lib/field-catalog/resolved-types';

// Props base que comparten todos los renderers de field específicos.
export type RenderProps = {
  field: ResolvedField;
  value: unknown;
  errorClass: string;
  onChange: (key: string, value: unknown) => void;
  // Sets a custom validation error for this field. Pasar null limpia.
  // El FormRenderer mantiene un map de customErrors y lo usa en
  // validateStep para bloquear el avance. Permite que un renderer custom
  // (ej: talent_services_panel) imponga reglas más allá de "required".
  // Built-ins típicamente no lo usan.
  setFieldError?: (message: string | null) => void;
  // Mensaje de error custom actualmente activo para este field, si lo hay.
  // Built-ins típicamente lo ignoran; renderers custom pueden mostrarlo
  // inline para complementar el errorClass.
  customError?: string;
};

export type SelectRenderProps = RenderProps & {
  selectPlaceholder: string;
};

// Construye el label visible del field con asterisco si es required.
export function labelText(field: ResolvedField): string {
  return field.required ? `${field.label} *` : field.label;
}
