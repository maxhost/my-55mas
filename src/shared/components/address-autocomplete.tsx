'use client';

import { useId, useState } from 'react';
import { AddressAutofill } from '@mapbox/search-js-react';
import { cn } from '@/lib/utils';

// Same classes as shadcn Input — Mapbox AddressAutofill requires a native
// <input> child (it cloneElement's the child to attach handlers).
const INPUT_CLASS =
  'h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80';

export type AddressValue = {
  street: string;
  postal_code: string;
  lat: number | null;
  lng: number | null;
  mapbox_id: string | null;
  raw_text: string;
  country_code: string;
  city_name: string;
};

export type AddressAutocompleteProps = {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  countryCodes: string[];
  language?: string;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  id?: string;
};

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';

type AutofillProps = {
  accessToken: string;
  options: { country?: string; language?: string };
  onRetrieve: (res: unknown) => void;
  children: React.ReactNode;
};

const Autofill = AddressAutofill as unknown as React.ComponentType<AutofillProps>;

export function AddressAutocomplete({
  value,
  onChange,
  countryCodes,
  language,
  placeholder,
  disabled,
  hasError,
  id,
}: AddressAutocompleteProps) {
  const inputId = useId();
  const [text, setText] = useState(value.raw_text || value.street || '');

  const handleRetrieve = (res: unknown) => {
    const r = res as {
      features?: Array<{
        id?: string;
        properties?: Record<string, string>;
        geometry?: { coordinates?: [number, number] };
      }>;
    };
    const feature = r?.features?.[0];
    if (!feature) return;
    const props = feature.properties ?? {};
    const [lng, lat] = feature.geometry?.coordinates ?? [null, null];
    const street = [props.address_line1, props.address_line2].filter(Boolean).join(', ');
    const cityName =
      props.address_level2 ?? props.place ?? props.locality ?? props.address_level3 ?? '';
    const countryCode = (props.country_code ?? props.country ?? '').toLowerCase();
    const next: AddressValue = {
      street: street || props.full_address || text,
      postal_code: props.postcode ?? '',
      lat: typeof lat === 'number' ? lat : null,
      lng: typeof lng === 'number' ? lng : null,
      mapbox_id: feature.id ?? null,
      raw_text: props.full_address ?? text,
      country_code: countryCode,
      city_name: cityName,
    };
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.info('[AddressAutocomplete] retrieved:', {
        country_code: countryCode,
        city_name: cityName,
        properties: props,
      });
    }
    setText(next.raw_text);
    onChange(next);
  };

  const inputEl = (
    <input
      id={id ?? inputId}
      type="text"
      autoComplete="address-line1"
      value={text}
      placeholder={placeholder}
      disabled={disabled}
      aria-invalid={hasError ? 'true' : undefined}
      className={cn(INPUT_CLASS)}
      onChange={(e) => {
        setText(e.target.value);
        onChange({ ...value, raw_text: e.target.value, street: e.target.value });
      }}
    />
  );

  if (!TOKEN) return inputEl;

  return (
    <Autofill
      accessToken={TOKEN}
      options={{
        country: countryCodes.length > 0 ? countryCodes.join(',') : undefined,
        language,
      }}
      onRetrieve={handleRetrieve}
    >
      {inputEl}
    </Autofill>
  );
}

export const emptyAddress: AddressValue = {
  street: '',
  postal_code: '',
  lat: null,
  lng: null,
  mapbox_id: null,
  raw_text: '',
  country_code: '',
  city_name: '',
};
