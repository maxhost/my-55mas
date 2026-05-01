'use client';

import { useId, useState } from 'react';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';

// @mapbox/search-js-react accesses `document` at module load — defer to client only.
const AddressAutofill = dynamic(
  () => import('@mapbox/search-js-react').then((m) => m.AddressAutofill as unknown as React.ComponentType<unknown>),
  { ssr: false }
);

export type AddressValue = {
  street: string;
  postal_code: string;
  lat: number | null;
  lng: number | null;
  mapbox_id: string | null;
  raw_text: string;
};

export type AddressAutocompleteProps = {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  /** ISO 3166-1 alpha-2 country code, e.g. "ES" — restricts suggestions */
  countryCode: string;
  language?: string;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  id?: string;
};

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';

export function AddressAutocomplete({
  value,
  onChange,
  countryCode,
  language,
  placeholder,
  disabled,
  hasError,
  id,
}: AddressAutocompleteProps) {
  const inputId = useId();
  const [text, setText] = useState(value.raw_text || value.street || '');

  const handleRetrieve = (res: any) => {
    const feature = res?.features?.[0];
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
    };
    setText(next.raw_text);
    onChange(next);
  };

  // Graceful degradation when token missing: render a plain input that stores raw_text only.
  if (!TOKEN) {
    return (
      <Input
        id={id ?? inputId}
        type="text"
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
  }

  const Autofill = AddressAutofill as unknown as React.ComponentType<{
    accessToken: string;
    options: { country: string; language?: string };
    onRetrieve: (res: any) => void;
    children: React.ReactNode;
  }>;
  return (
    <Autofill
      accessToken={TOKEN}
      options={{ country: countryCode, language }}
      onRetrieve={handleRetrieve as never}
    >
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
          onChange({ ...value, raw_text: e.target.value });
        }}
      />
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
};
