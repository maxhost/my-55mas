'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FieldProps } from '../types';

export function FullNameInput({
  id,
  label,
  placeholder,
  help,
  error,
  value,
  onChange,
  required,
  disabled,
}: FieldProps<string>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-hidden> *</span> : null}
      </Label>
      <Input
        id={id}
        type="text"
        autoComplete="name"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={help ? `${id}-help` : undefined}
      />
      {help ? <p id={`${id}-help`} className="text-sm text-muted-foreground">{help}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
