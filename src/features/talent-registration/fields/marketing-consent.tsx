'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { FieldProps } from '../types';

export function MarketingConsentInput({
  id,
  label,
  error,
  value,
  onChange,
  disabled,
}: FieldProps<boolean>) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-2">
        <Checkbox
          id={id}
          checked={value}
          onCheckedChange={(c) => onChange(c === true)}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
        />
        <Label htmlFor={id} className="text-sm font-normal leading-snug">
          {label}
        </Label>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
