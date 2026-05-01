'use client';

import { useEffect, useId, useState } from 'react';
import { Input } from '@/components/ui/input';

export type AddressValue = {
  street: string;
  postal_code: string;
  lat: number | null;
  lng: number | null;
  mapbox_id: string | null;
  raw_text: string;
  /** lowercase ISO 3166-1 alpha-2 from Mapbox properties.country_code */
  country_code: string;
  /** city/locality name from Mapbox properties.place */
  city_name: string;
};

export type AddressAutocompleteProps = {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  /** ISO 3166-1 alpha-2 codes (uppercase) — restricts suggestions to these countries. Empty array = no restriction. */
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
  const [Autofill, setAutofill] = useState<React.ComponentType<AutofillProps> | null>(null);

  useEffect(() => {
    if (!TOKEN) return;
    let cancelled = false;
    import('@mapbox/search-js-react').then((m) => {
      if (cancelled) return;
      setAutofill(() => m.AddressAutofill as unknown as React.ComponentType<AutofillProps>);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
    const next: AddressValue = {
      street: street || props.full_address || text,
      postal_code: props.postcode ?? '',
      lat: typeof lat === 'number' ? lat : null,
      lng: typeof lng === 'number' ? lng : null,
      mapbox_id: feature.id ?? null,
      raw_text: props.full_address ?? text,
      country_code: (props.country_code ?? '').toLowerCase(),
      city_name: props.place ?? props.locality ?? '',
    };
    setText(next.raw_text);
    onChange(next);
  };

  const inputEl = (
    <Input
      id={id ?? inputId}
      type="text"
      autoComplete="address-line1"
      value={text}
      placeholder={placeholder}
      disabled={disabled}
      aria-invalid={hasError ? 'true' : undefined}
      onChange={(e) => {
        setText(e.target.value);
        onChange({ ...value, raw_text: e.target.value, street: e.target.value });
      }}
    />
  );

  if (!TOKEN || !Autofill) return inputEl;

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
