import type { ZodIssue } from 'zod';

export type FormFieldI18n = {
  label?: string;
  placeholder?: string;
  help?: string;
  errors?: Record<string, string>;
};

export type FormFieldsI18n = Record<string, FormFieldI18n>;

const ZOD_CODE_TO_KEY: Record<string, string> = {
  invalid_type: 'required',
  too_small: 'minLength',
  too_big: 'maxLength',
  invalid_string: 'invalid',
  invalid_enum_value: 'invalid',
  custom: 'invalid',
};

export function resolveFieldError(
  fieldKey: string,
  issue: ZodIssue | undefined,
  fields: FormFieldsI18n | null | undefined
): string | null {
  if (!issue) return null;
  const fieldI18n = fields?.[fieldKey];
  const errors = fieldI18n?.errors ?? {};
  const errorKey = ZOD_CODE_TO_KEY[issue.code] ?? 'invalid';
  return errors[errorKey] ?? errors.invalid ?? errors.required ?? issue.message;
}

export function buildFieldErrorMap(
  issues: ZodIssue[],
  fields: FormFieldsI18n | null | undefined
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const fieldKey = String(issue.path[0] ?? '');
    if (!fieldKey || out[fieldKey]) continue;
    const message = resolveFieldError(fieldKey, issue, fields);
    if (message) out[fieldKey] = message;
  }
  return out;
}
