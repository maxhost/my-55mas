'use client';

import { useId, useState } from 'react';
import { cn } from '@/lib/utils';

const INPUT_CLASS =
  'h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80';

export type AddressValue = {
  street: string;
  postal_code: string;
  lat: number | null;
  lng: number | null;
  mapbox_id: string | null;
  raw_text: string;
  /** lowercase ISO 3166-1 alpha-2 from Mapbox geocoding */
  country_code: string;
  /** city/locality name from Mapbox geocoding context.place.name */
  city_name: string;
};

export type AddressAutocompleteProps = {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  /** ISO 3166-1 alpha-2 codes (uppercase) — restricts geocoding to these countries. Empty = no restriction. */
  countryCodes: string[];
  language?: string;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  id?: string;
};

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';
const MIN_QUERY_LENGTH = 6;

type GeocodeFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    full_address?: string;
    name?: string;
    address?: string;
    mapbox_id?: string;
    context?: {
      address?: { name?: string };
      street?: { name?: string };
      postcode?: { name?: string };
      place?: { name?: string };
      country?: { country_code?: string };
    };
  };
};

async function geocodeAddress(
  query: string,
  countryCodes: string[],
  language: string | undefined,
): Promise<GeocodeFeature | null> {
  if (!TOKEN || query.trim().length < MIN_QUERY_LENGTH) return null;
  const params = new URLSearchParams({
    q: query.trim(),
    access_token: TOKEN,
    limit: '1',
    types: 'address,street,place',
  });
  if (countryCodes.length > 0) params.set('country', countryCodes.join(',').toLowerCase());
  if (language) params.set('language', language);

  try {
    const res = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { features?: GeocodeFeature[] };
    return data.features?.[0] ?? null;
  } catch {
    return null;
  }
}

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
  const [isResolving, setIsResolving] = useState(false);

  const resolveAndPopulate = async (query: string) => {
    if (!query || query === value.raw_text && value.country_code) return;
    setIsResolving(true);
    try {
      const feature = await geocodeAddress(query, countryCodes, language);
      if (!feature) {
        // Couldn't resolve — keep what user typed; country/city stay empty so
        // the manual fallback dropdown shows up.
        onChange({
          ...value,
          street: query,
          raw_text: query,
          country_code: '',
          city_name: '',
        });
        return;
      }
      const ctx = feature.properties?.context ?? {};
      const [lng, lat] = feature.geometry?.coordinates ?? [null, null];
      const next: AddressValue = {
        street:
          ctx.address?.name ?? ctx.street?.name ?? feature.properties?.address ?? query,
        postal_code: ctx.postcode?.name ?? '',
        lat: typeof lat === 'number' ? lat : null,
        lng: typeof lng === 'number' ? lng : null,
        mapbox_id: feature.properties?.mapbox_id ?? null,
        raw_text: feature.properties?.full_address ?? query,
        country_code: (ctx.country?.country_code ?? '').toLowerCase(),
        city_name: ctx.place?.name ?? '',
      };
      setText(next.raw_text);
      onChange(next);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="relative">
      <input
        id={id ?? inputId}
        name="address-line1"
        type="text"
        autoComplete="off"
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={hasError ? 'true' : undefined}
        aria-busy={isResolving ? 'true' : undefined}
        className={cn(INPUT_CLASS, isResolving && 'pr-10')}
        onChange={(e) => {
          setText(e.target.value);
          // Clear derived fields when user edits manually so stale country/city don't persist.
          onChange({
            ...value,
            raw_text: e.target.value,
            street: e.target.value,
            country_code: '',
            city_name: '',
          });
        }}
        onBlur={(e) => {
          void resolveAndPopulate(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void resolveAndPopulate((e.target as HTMLInputElement).value);
          }
        }}
      />
      {isResolving && (
        <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
          …
        </span>
      )}
    </div>
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
