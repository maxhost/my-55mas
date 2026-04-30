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
import { renderEmailAuth } from './field-renderers/email';
import {
  inputRenderers,
  registerInputRenderer,
  type InputRenderer,
} from './field-renderers/registry';
import type { InputType } from '@/shared/lib/field-catalog/types';

// Re-exports para consumers externos que importen desde este path.
export {
  renderTermsCheckbox,
  renderMultiselectCheckbox,
  renderMultiselectDropdown,
  registerInputRenderer,
  inputRenderers,
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

// ── Built-ins registration (module init) ─────────────
//
// Se ejecuta una sola vez al cargar este módulo. Cualquier consumer de
// `renderResolvedField` ya importa este archivo, así que los built-ins
// quedan registrados en el momento exacto en que el dispatcher se usa.
//
// Feature-specific renderers se registran por separado vía side-effect
// import desde `app/[locale]/layout.tsx` (ej:
// `import '@/features/talent-services/init/register-renderers'`).

const builtIns: ReadonlyArray<[InputType, InputRenderer]> = [
  ['text', (props) => renderText(props, 'text')],
  [
    'email',
    (props) =>
      props.field.persistence_type === 'auth'
        ? renderEmailAuth(props)
        : renderText(props, 'email'),
  ],
  ['password', (props) => renderText(props, 'password')],
  ['date', (props) => renderText(props, 'date')],
  ['number', (props) => renderNumber(props)],
  ['boolean', (props) => renderBoolean(props)],
  ['textarea', (props) => renderTextarea(props)],
  ['single_select', (props) => renderSingleSelect(props as SelectRenderProps)],
  ['multiselect_checkbox', (props) => renderMultiselectCheckbox(props)],
  [
    'multiselect_dropdown',
    (props) => renderMultiselectDropdown(props as SelectRenderProps),
  ],
  ['address', (props) => renderAddress(props)],
  ['display_text', (props) => renderDisplayText(props)],
  ['terms_checkbox', (props) => renderTermsCheckbox(props)],
];

// Registrar built-ins. Idempotente: si por algún motivo este módulo se
// evalúa dos veces (ej: HMR), saltamos los ya registrados.
for (const [type, fn] of builtIns) {
  if (!inputRenderers.has(type)) {
    registerInputRenderer(type, fn);
  }
}

// ── Dispatcher (registry-based lookup) ───────────────

export function renderResolvedField(
  field: ResolvedField,
  value: unknown,
  errorClass: string,
  onChange: (key: string, value: unknown) => void,
  selectPlaceholder = '',
  setFieldError?: (message: string | null) => void,
  customError?: string
) {
  const props: SelectRenderProps = {
    field,
    value,
    errorClass,
    onChange,
    selectPlaceholder,
    setFieldError,
    customError,
  };
  const renderer = inputRenderers.get(field.input_type);
  if (!renderer) return null;
  return renderer(props);
}
