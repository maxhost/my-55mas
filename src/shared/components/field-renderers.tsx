import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ResolvedField } from '@/shared/lib/field-catalog/resolved-types';

// ── Types ────────────────────────────────────────────

type RenderProps = {
  field: ResolvedField;
  value: unknown;
  errorClass: string;
  onChange: (key: string, value: unknown) => void;
};

type SelectRenderProps = RenderProps & {
  selectPlaceholder: string;
};

// ── Primitives ───────────────────────────────────────

function labelText(field: ResolvedField): string {
  return field.required ? `${field.label} *` : field.label;
}

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
    <div key={field.key} className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(field.key, e.target.checked)}
        className="h-4 w-4"
      />
      <Label>{labelText(field)}</Label>
    </div>
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

export function renderMultiselect({ field, value, onChange }: RenderProps) {
  const options = field.options ?? [];
  const labels = field.option_labels ?? {};
  const selected = (value as string[] | undefined) ?? [];
  return (
    <div key={field.key} className="space-y-1">
      <Label>{labelText(field)}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={(e) => {
                const next = e.target.checked
                  ? [...selected, opt]
                  : selected.filter((s) => s !== opt);
                onChange(field.key, next);
              }}
              className="h-4 w-4"
            />
            {labels[opt] ?? opt}
          </label>
        ))}
      </div>
      {field.description && (
        <p className="text-muted-foreground text-xs">{field.description}</p>
      )}
    </div>
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
    case 'multiselect':
      return renderMultiselect(base);
    default: {
      const _exhaustive: never = field.input_type;
      void _exhaustive;
      return null;
    }
  }
}
