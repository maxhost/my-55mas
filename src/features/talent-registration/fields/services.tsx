'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { ServiceOption } from '../types';

type Props = {
  options: ServiceOption[];
  value: string[];
  onChange: (next: string[]) => void;
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
};

export function ServicesField({
  options,
  value,
  onChange,
  label,
  help,
  error,
  required,
  disabled,
  emptyMessage,
}: Props) {
  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">
        {label}
        {required ? <span aria-hidden> *</span> : null}
      </legend>
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((opt) => {
            const checked = value.includes(opt.id);
            return (
              <Label
                key={opt.id}
                className="flex items-center gap-2 rounded-md border p-2 text-sm font-normal"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(opt.id)}
                  disabled={disabled}
                />
                <span>{opt.name}</span>
              </Label>
            );
          })}
        </div>
      )}
      {help ? <p className="text-sm text-muted-foreground">{help}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </fieldset>
  );
}
