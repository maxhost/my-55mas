'use client';

import { z } from 'zod';
import { Label } from '@/components/ui/label';
import {
  AddressAutocomplete,
  emptyAddress,
  type AddressValue,
} from '@/shared/components/address-autocomplete';
import type { FieldProps } from '../types';

export const addressSchema = z.object({
  street: z.string().min(1),
  postal_code: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  mapbox_id: z.string().nullable(),
  raw_text: z.string().min(1),
  country_code: z.string(),
  city_name: z.string(),
});

export { emptyAddress };

type Props = FieldProps<AddressValue> & {
  countryCodes: string[];
  language?: string;
};

export function AddressField({
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
  language,
}: Props) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-hidden> *</span> : null}
      </Label>
      <AddressAutocomplete
        id={id}
        value={value}
        onChange={onChange}
        countryCodes={countryCodes}
        language={language}
        placeholder={placeholder}
        disabled={disabled}
        hasError={Boolean(error)}
      />
      {help ? <p className="text-sm text-muted-foreground">{help}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
