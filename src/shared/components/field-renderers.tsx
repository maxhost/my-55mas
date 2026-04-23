import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ResolvedField } from '@/shared/lib/field-catalog/resolved-types';
import {
  AddressAutocomplete,
  type AddressValue,
} from './address-autocomplete';

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
  // Mismo shell visual que renderTermsCheckbox (items-start, text-sm,
  // mt-0.5 en el input para alinear con texto que puede wrappear).
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

// Checkbox de aceptación de términos con enlaces inline embebidos en la
// label. La label usa placeholders {tos} y {privacy} que se reemplazan
// por <a target="_blank"> con los textos de option_labels (per-locale) y
// las URLs de field.config (globales). Si una URL no está seteada, el
// placeholder se renderiza como texto plano (o se omite si admin quiere).
export function renderTermsCheckbox({ field, value, onChange }: RenderProps) {
  const config = (field.config ?? {}) as {
    tos_url?: string;
    privacy_url?: string;
  };
  const linkLabels = field.option_labels ?? {};
  const checked = value === true;

  const renderLinkOrText = (
    key: string,
    url: string | undefined,
    text: string
  ): ReactNode => {
    if (!text) return null;
    if (!url) return text; // placeholder sin URL → texto plano
    return (
      <a
        key={key}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-link underline hover:opacity-80"
      >
        {text}
      </a>
    );
  };

  // Split por placeholders {tos} y {privacy} manteniendo los delimitadores
  // para poder intercalar los <a> en su posición exacta dentro del texto.
  const template = field.label || '';
  const hasTosPh = template.includes('{tos}');
  const hasPrivacyPh = template.includes('{privacy}');

  let nodes: ReactNode[];
  if (hasTosPh || hasPrivacyPh) {
    const parts = template.split(/(\{tos\}|\{privacy\})/);
    nodes = parts.map((part, i) => {
      if (part === '{tos}') {
        return renderLinkOrText(`tos-${i}`, config.tos_url, linkLabels.tos ?? '');
      }
      if (part === '{privacy}') {
        return renderLinkOrText(
          `priv-${i}`,
          config.privacy_url,
          linkLabels.privacy ?? ''
        );
      }
      return part;
    });
  } else {
    // Fallback: template sin placeholders → auto-append de los links al final.
    // Evita que un admin que olvidó los {tos}/{privacy} tenga links
    // silenciosamente perdidos — robustez por diseño.
    const tosNode = renderLinkOrText('tos-append', config.tos_url, linkLabels.tos ?? '');
    const privacyNode = renderLinkOrText(
      'priv-append',
      config.privacy_url,
      linkLabels.privacy ?? ''
    );
    nodes = [template];
    if (tosNode) nodes.push(' ', tosNode);
    if (tosNode && privacyNode) nodes.push(' · ');
    else if (privacyNode) nodes.push(' ');
    if (privacyNode) nodes.push(privacyNode);
  }

  return (
    <div key={field.key} className="space-y-1">
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(field.key, e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0"
        />
        <span>
          {nodes}
          {field.required && <span aria-hidden="true"> *</span>}
        </span>
      </label>
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

export function renderMultiselectCheckbox({ field, value, onChange }: RenderProps) {
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

// Dropdown con chips: el SelectTrigger ES la barra full-width (así el
// SelectContent se ancla al ancho del input). Los chips viven dentro del
// trigger; los X usan spans con role=button para evitar nested <button>,
// y stopPropagation para no disparar la apertura del dropdown al removerlos.
export function renderMultiselectDropdown({
  field,
  value,
  errorClass,
  onChange,
  selectPlaceholder,
}: SelectRenderProps) {
  const options = field.options ?? [];
  const labels = field.option_labels ?? {};
  const selected = (value as string[] | undefined) ?? [];
  const available = options.filter((opt) => !selected.includes(opt));

  const addValue = (next: string) => {
    if (!next) return;
    if (selected.includes(next)) return;
    onChange(field.key, [...selected, next]);
  };
  const removeValue = (opt: string) => {
    onChange(field.key, selected.filter((s) => s !== opt));
  };

  return (
    <div key={field.key} className="space-y-1">
      <Label>{labelText(field)}</Label>
      <Select
        value=""
        onValueChange={(v) => {
          if (v == null) return;
          addValue(v);
        }}
      >
        <SelectTrigger
          aria-label={field.label}
          className={`data-[size=default]:h-auto min-h-9 w-full justify-between whitespace-normal py-1 ${errorClass}`}
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">
                {field.placeholder || selectPlaceholder}
              </span>
            ) : (
              selected.map((opt) => (
                <span
                  key={opt}
                  className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-md pl-2 pr-1 py-0.5 text-xs"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {labels[opt] ?? opt}
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="remove"
                    className="hover:bg-muted-foreground/20 inline-flex size-4 items-center justify-center rounded cursor-pointer"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      removeValue(opt);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        removeValue(opt);
                      }
                    }}
                  >
                    <X className="size-3" />
                  </span>
                </span>
              ))
            )}
          </div>
        </SelectTrigger>
        <SelectContent>
          {available.length === 0 ? (
            <div className="text-muted-foreground p-2 text-xs">
              (sin más opciones)
            </div>
          ) : (
            available.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {labels[opt] ?? opt}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
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
