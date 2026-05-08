'use client';

import { type CountryCode } from 'libphonenumber-js';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/shared/components/phone-input';
import type { FieldProps } from '../types';

type Props = FieldProps<string> & {
  countryCodes: CountryCode[];
  defaultCountry?: CountryCode;
};

export function PhoneField({
  id,
  label,
  placeholder,
  help,
  error,
  value,
  onChange,
  required,
  disabled,
  countryCodes,
  defaultCountry,
}: Props) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-hidden> *</span> : null}
      </Label>
      <PhoneInput
        id={id}
        value={value}
        onChange={onChange}
        countryCodes={countryCodes}
        defaultCountry={defaultCountry}
        placeholder={placeholder}
        disabled={disabled}
        hasError={Boolean(error)}
      />
      {help ? <p className="text-sm text-muted-foreground">{help}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
