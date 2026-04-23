import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ResolvedField } from '@/shared/lib/field-catalog/resolved-types';
import {
  AddressAutocomplete,
  type AddressValue,
} from './address-autocomplete';
import {
  labelText,
  type RenderProps,
  type SelectRenderProps,
} from './field-renderers/shared';
import { renderTermsCheckbox } from './field-renderers/terms-checkbox';
import {
  renderMultiselectCheckbox,
  renderMultiselectDropdown,
} from './field-renderers/multiselect';

// Re-exports para consumers externos que importen desde este path.
export {
  renderTermsCheckbox,
  renderMultiselectCheckbox,
  renderMultiselectDropdown,
};
export type { RenderProps, SelectRenderProps };

// ── Primitives ───────────────────────────────────────

export function renderText(
  props: RenderProps,
  htmlType: 'text' | 'email' | 'password' | 'date'
) {
  const { field, value, errorClass, onChange } = props;
  return (
    <div key={field.key} className="space-y-1">
      <Label>{labelText(field)}</Label>
      <Input
        type={htmlType}
        value={(value as string) ?? ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={field.placeholder}
        className={errorClass}
      />
      {field.description && (
        <p className="text-muted-foreground text-xs">{field.description}</p>
      )}
    </div>
  );
}

export function renderNumber({ field, value, errorClass, onChange }: RenderProps) {
  return (
    <div key={field.key} className="space-y-1">
      <Label>{labelText(field)}</Label>
      <Input
        type="number"
        value={value === undefined || value === null ? '' : String(value)}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(field.key, raw === '' ? undefined : Number(raw));
        }}
        placeholder={field.placeholder}
        className={errorClass}
      />
      {field.description && (
        <p className="text-muted-foreground text-xs">{field.description}</p>
      )}
    </div>
  );
}

export function renderBoolean({ field, value, onChange }: RenderProps) {
  return (
    <label key={field.key} className="flex items-start gap-2 text-sm">
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(field.key, e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0"
      />
      <span>
        {field.label}
        {field.required && <span aria-hidden="true"> *</span>}
      </span>
    </label>
  );
}

export function renderTextarea({ field, value, errorClass, onChange }: RenderProps) {
  return (
    <div key={field.key} className="space-y-1">
      <Label>{labelText(field)}</Label>
      <Textarea
        value={(value as string) ?? ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={field.placeholder}
        rows={3}
        className={errorClass}
      />
      {field.description && (
        <p className="text-muted-foreground text-xs">{field.description}</p>
      )}
    </div>
  );
}

export function renderSingleSelect({
  field,
  value,
  errorClass,
  onChange,
  selectPlaceholder,
}: SelectRenderProps) {
  const options = field.options ?? [];
  const labels = field.option_labels ?? {};
  return (
    <div key={field.key} className="space-y-1">
      <Label>{labelText(field)}</Label>
      <select
        value={(value as string) ?? ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        className={`border-border bg-background h-9 w-full rounded-md border px-3 text-sm ${errorClass}`}
      >
        <option value="">{field.placeholder || selectPlaceholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {labels[opt] ?? opt}
          </option>
        ))}
      </select>
      {field.description && (
        <p className="text-muted-foreground text-xs">{field.description}</p>
      )}
    </div>
  );
}

// Texto estático para mostrar al usuario (legales, disclaimers, instrucciones).
// No es input: no captura valor, no persiste. El contenido vive en
// translations.description del catálogo, con fallback a label. Respeta saltos
// de línea del original (whitespace-pre-line).
export function renderDisplayText({ field }: RenderProps) {
  const content = field.description ?? field.label ?? '';
  if (!content) return null;
  return (
    <div
      key={field.key}
      className="text-muted-foreground text-sm whitespace-pre-line"
    >
      {content}
    </div>
  );
}

export function renderAddress({ field, value, errorClass, onChange }: RenderProps) {
  return (
    <AddressAutocomplete
      value={value as AddressValue | null | undefined}
      onChange={(next) => onChange(field.key, next)}
      label={labelText(field)}
      placeholder={field.placeholder}
      description={field.description}
      required={field.required}
      errorClass={errorClass}
    />
  );
}

// ── Dispatcher ───────────────────────────────────────

export function renderResolvedField(
  field: ResolvedField,
  value: unknown,
  errorClass: string,
  onChange: (key: string, value: unknown) => void,
  selectPlaceholder = ''
) {
  const base: RenderProps = { field, value, errorClass, onChange };
  const selectBase: SelectRenderProps = { ...base, selectPlaceholder };
  switch (field.input_type) {
    case 'text':
    case 'email':
    case 'password':
    case 'date':
      return renderText(base, field.input_type);
    case 'number':
      return renderNumber(base);
    case 'boolean':
      return renderBoolean(base);
    case 'textarea':
      return renderTextarea(base);
    case 'single_select':
      return renderSingleSelect(selectBase);
    case 'multiselect_checkbox':
      return renderMultiselectCheckbox(base);
    case 'multiselect_dropdown':
      return renderMultiselectDropdown(selectBase);
    case 'address':
      return renderAddress(base);
    case 'display_text':
      return renderDisplayText(base);
    case 'terms_checkbox':
      return renderTermsCheckbox(base);
    default: {
      const _exhaustive: never = field.input_type;
      void _exhaustive;
      return null;
    }
  }
}
