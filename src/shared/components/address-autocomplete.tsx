'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Shape que se persiste (jsonb). Nunca rompemos esta forma sin migración.
export type AddressValue = {
  formatted: string;
  lat?: number;
  lng?: number;
  mapbox_id?: string;
  components?: {
    street?: string;
    neighborhood?: string;
    postcode?: string;
    locality?: string;
    place?: string;
    region?: string;
    country?: string;
    country_code?: string;
  };
};

type MapboxSuggestion = {
  mapbox_id: string;
  name: string;
  full_address?: string;
  place_formatted?: string;
};

type MapboxSuggestResponse = {
  suggestions: MapboxSuggestion[];
};

type MapboxRetrieveContextItem = {
  id?: string;
  name?: string;
  text?: string;
  country_code?: string;
};

type MapboxRetrieveFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    full_address?: string;
    place_formatted?: string;
    coordinates?: { latitude?: number; longitude?: number };
    context?: Record<string, MapboxRetrieveContextItem>;
  };
};

type MapboxRetrieveResponse = {
  features: MapboxRetrieveFeature[];
};

type Props = {
  value: AddressValue | null | undefined;
  onChange: (next: AddressValue | null) => void;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  errorClass?: string;
  language?: string;
  countries?: string[];
};

const MAPBOX_URL = 'https://api.mapbox.com/search/searchbox/v1';
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';

// Session token para que Mapbox cobre por "sesión" (varios suggest + 1 retrieve).
function newSessionToken(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function extractComponents(
  feature: MapboxRetrieveFeature
): AddressValue['components'] {
  const ctx = feature.properties?.context ?? {};
  const pick = (key: string) => ctx[key]?.name ?? ctx[key]?.text;
  return {
    street: pick('address'),
    neighborhood: pick('neighborhood'),
    postcode: pick('postcode'),
    locality: pick('locality'),
    place: pick('place'),
    region: pick('region'),
    country: pick('country'),
    country_code: ctx.country?.country_code,
  };
}

export function AddressAutocomplete({
  value,
  onChange,
  label,
  placeholder,
  description,
  required,
  errorClass,
  language = 'es',
  countries,
}: Props) {
  const [query, setQuery] = useState(value?.formatted ?? '');
  const [suggestions, setSuggestions] = useState<MapboxSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const sessionRef = useRef<string>(newSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Sync el input si el value (current_value) cambia externamente.
  useEffect(() => {
    setQuery(value?.formatted ?? '');
  }, [value?.formatted]);

  // Cerrar sugerencias al hacer click fuera.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const fetchSuggestions = async (q: string) => {
    if (!TOKEN) {
      console.warn('[AddressAutocomplete] NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN not set');
      return;
    }
    if (q.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({
      q,
      access_token: TOKEN,
      session_token: sessionRef.current,
      language,
      limit: '5',
    });
    if (countries && countries.length > 0) {
      params.set('country', countries.join(','));
    }
    try {
      const res = await fetch(`${MAPBOX_URL}/suggest?${params.toString()}`);
      if (!res.ok) throw new Error(`Mapbox suggest ${res.status}`);
      const data = (await res.json()) as MapboxSuggestResponse;
      setSuggestions(data.suggestions ?? []);
      setOpen(true);
    } catch (err) {
      console.error('[AddressAutocomplete] suggest error:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (v: string) => {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 300);
  };

  const handleSelect = async (suggestion: MapboxSuggestion) => {
    setOpen(false);
    if (!TOKEN) return;
    const params = new URLSearchParams({
      access_token: TOKEN,
      session_token: sessionRef.current,
      language,
    });
    try {
      const res = await fetch(
        `${MAPBOX_URL}/retrieve/${suggestion.mapbox_id}?${params.toString()}`
      );
      if (!res.ok) throw new Error(`Mapbox retrieve ${res.status}`);
      const data = (await res.json()) as MapboxRetrieveResponse;
      const feature = data.features?.[0];
      if (!feature) return;
      const formatted =
        feature.properties?.full_address ??
        feature.properties?.place_formatted ??
        suggestion.name;
      const coords =
        feature.properties?.coordinates ??
        (feature.geometry?.coordinates
          ? {
              latitude: feature.geometry.coordinates[1],
              longitude: feature.geometry.coordinates[0],
            }
          : undefined);
      const next: AddressValue = {
        formatted,
        lat: coords?.latitude,
        lng: coords?.longitude,
        mapbox_id: suggestion.mapbox_id,
        components: extractComponents(feature),
      };
      setQuery(formatted);
      onChange(next);
      // Rotar el session token tras un retrieve (nueva sesión).
      sessionRef.current = newSessionToken();
    } catch (err) {
      console.error('[AddressAutocomplete] retrieve error:', err);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setOpen(false);
    onChange(null);
  };

  return (
    <div ref={rootRef} className="relative space-y-1">
      <Label>
        {label}
        {required && ' *'}
      </Label>
      <Input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        className={errorClass}
        autoComplete="off"
      />
      {loading && (
        <p className="text-muted-foreground text-xs">Buscando…</p>
      )}
      {open && suggestions.length > 0 && (
        <ul className="bg-popover absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border shadow-md">
          {suggestions.map((s) => (
            <li key={s.mapbox_id}>
              <button
                type="button"
                className="hover:bg-accent w-full px-3 py-2 text-left text-sm"
                onClick={() => handleSelect(s)}
              >
                <div className="font-medium">{s.name}</div>
                {(s.full_address || s.place_formatted) && (
                  <div className="text-muted-foreground text-xs">
                    {s.full_address ?? s.place_formatted}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {value && !loading && (
        <div className="flex items-center gap-2 text-xs">
          {value.lat !== undefined && value.lng !== undefined && (
            <span className="text-muted-foreground">
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </span>
          )}
          <button
            type="button"
            className="text-muted-foreground hover:text-destructive underline"
            onClick={handleClear}
          >
            Limpiar
          </button>
        </div>
      )}
      {description && (
        <p className="text-muted-foreground text-xs">{description}</p>
      )}
    </div>
  );
}
