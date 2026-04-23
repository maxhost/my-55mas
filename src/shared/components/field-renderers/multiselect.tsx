import { X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { labelText, type RenderProps, type SelectRenderProps } from './shared';

// Lista vertical de checkboxes — uno por opción.
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
    onChange(
      field.key,
      selected.filter((s) => s !== opt)
    );
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
