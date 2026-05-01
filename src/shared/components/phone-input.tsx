'use client';

import { useMemo, useState } from 'react';
import {
  AsYouType,
  getCountryCallingCode,
  isValidPhoneNumber,
  type CountryCode,
} from 'libphonenumber-js';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type PhoneInputProps = {
  /** Initial E.164 phone (e.g. "+34612345678") */
  value: string;
  /** Called with E.164 string when user types or changes country */
  onChange: (e164: string) => void;
  /** ISO 3166-1 alpha-2 country code list to show in dropdown */
  countryCodes: CountryCode[];
  /** Default country selection (ISO alpha-2). If absent, uses first of countryCodes. */
  defaultCountry?: CountryCode;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  id?: string;
  ariaLabel?: string;
};

function parseInitial(value: string, fallback: CountryCode): {
  country: CountryCode;
  national: string;
} {
  if (!value) return { country: fallback, national: '' };
  // Pick the longest matching country code prefix
  const match = value.match(/^\+(\d{1,3})/);
  if (!match) return { country: fallback, national: value.replace(/^\+/, '') };
  const calling = match[1];
  const dial = `+${calling}`;
  return { country: fallback, national: value.startsWith(dial) ? value.slice(dial.length).trim() : value };
}

export function PhoneInput({
  value,
  onChange,
  countryCodes,
  defaultCountry,
  placeholder,
  disabled,
  hasError,
  id,
  ariaLabel,
}: PhoneInputProps) {
  const fallback = defaultCountry ?? countryCodes[0];
  const initial = useMemo(() => parseInitial(value, fallback), [value, fallback]);

  const [country, setCountry] = useState<CountryCode>(initial.country);
  const [national, setNational] = useState<string>(initial.national);

  const callingCode = (() => {
    try {
      return getCountryCallingCode(country);
    } catch {
      return '';
    }
  })();

  const update = (next: { country?: CountryCode; national?: string }) => {
    const c = next.country ?? country;
    const n = next.national ?? national;
    if (next.country) setCountry(c);
    if (next.national !== undefined) setNational(n);
    if (!n) {
      onChange('');
      return;
    }
    const formatter = new AsYouType(c);
    formatter.input(n);
    const e164 = `+${getCountryCallingCode(c)}${n.replace(/[^\d]/g, '')}`;
    onChange(e164);
  };

  return (
    <div className="flex gap-2">
      <Select
        value={country}
        onValueChange={(v) => update({ country: v as CountryCode })}
        disabled={disabled}
      >
        <SelectTrigger className="w-[120px]" aria-label="Country code">
          <SelectValue>{`${country} +${callingCode}`}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {countryCodes.map((cc) => (
            <SelectItem key={cc} value={cc}>
              {cc} +{(() => { try { return getCountryCallingCode(cc); } catch { return ''; } })()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        inputMode="numeric"
        id={id}
        aria-label={ariaLabel}
        aria-invalid={hasError ? 'true' : undefined}
        placeholder={placeholder}
        value={national}
        onChange={(e) => update({ national: e.target.value })}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  );
}

export function isValidE164(value: string, country?: CountryCode): boolean {
  if (!value) return false;
  return isValidPhoneNumber(value, country);
}
