'use client';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { FieldProps } from '../types';

export function AdditionalInfoInput({
  id,
  label,
  placeholder,
  help,
  error,
  value,
  onChange,
  required,
  disabled,
}: FieldProps<string | undefined>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-hidden> *</span> : null}
      </Label>
      <Textarea
        id={id}
        value={value ?? ''}
        placeholder={placeholder}
        rows={4}
        maxLength={2000}
        onChange={(e) => onChange(e.target.value || undefined)}
        disabled={disabled}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={help ? `${id}-help` : undefined}
      />
      {help ? <p id={`${id}-help`} className="text-sm text-muted-foreground">{help}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
