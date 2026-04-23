import type { ResolvedField } from '@/shared/lib/field-catalog/resolved-types';

// Props base que comparten todos los renderers de field específicos.
export type RenderProps = {
  field: ResolvedField;
  value: unknown;
  errorClass: string;
  onChange: (key: string, value: unknown) => void;
};

export type SelectRenderProps = RenderProps & {
  selectPlaceholder: string;
};

// Construye el label visible del field con asterisco si es required.
export function labelText(field: ResolvedField): string {
  return field.required ? `${field.label} *` : field.label;
}
