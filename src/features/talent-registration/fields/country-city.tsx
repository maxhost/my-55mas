'use client';

import { z } from 'zod';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CityOption, CountryOption } from '../types';

export const countryIdSchema = z.string().uuid();
export const cityIdSchema = z.string().uuid();

type Props = {
  countries: CountryOption[];
  cities: CityOption[];
  countryValue: string;
  cityValue: string;
  onCityChange: (id: string) => void;
  countryLabel: string;
  cityLabel: string;
  cityPlaceholder?: string;
  cityError?: string;
  notDetectedHint: string;
  manualCityHint: string;
  required?: boolean;
  disabled?: boolean;
  cityFieldId?: string;
  /** Whether Mapbox returned a city name that didn't match any DB city — shows manual fallback. */
  cityNeedsManual: boolean;
};

export function CountryCityField({
  countries,
  cities,
  countryValue,
  cityValue,
  onCityChange,
  countryLabel,
  cityLabel,
  cityPlaceholder,
  cityError,
  notDetectedHint,
  manualCityHint,
  required,
  cityFieldId,
  cityNeedsManual,
}: Props) {
  const country = countries.find((c) => c.id === countryValue);
  const city = cities.find((c) => c.id === cityValue);
  const filteredCities = cities.filter((c) => c.country_id === countryValue);

  if (!countryValue) {
    return (
      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        {notDetectedHint}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-1.5">
        <Label>{countryLabel}</Label>
        <div
          className="flex h-9 items-center rounded-lg border border-input bg-muted/30 px-2.5 text-sm"
          aria-readonly
        >
          {country?.name ?? '—'}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={cityFieldId}>
          {cityLabel}
          {required ? <span aria-hidden> *</span> : null}
        </Label>
        {cityNeedsManual || !city ? (
          <>
            <Select
              value={cityValue}
              onValueChange={(v) => onCityChange(v ?? '')}
            >
              <SelectTrigger id={cityFieldId} aria-invalid={cityError ? 'true' : undefined}>
                <SelectValue placeholder={cityPlaceholder}>
                  {(v: string) =>
                    filteredCities.find((c) => c.id === v)?.name ?? cityPlaceholder ?? ''
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {filteredCities.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{manualCityHint}</p>
          </>
        ) : (
          <div
            className="flex h-9 items-center rounded-lg border border-input bg-muted/30 px-2.5 text-sm"
            aria-readonly
          >
            {city.name}
          </div>
        )}
        {cityError ? <p className="text-sm text-destructive">{cityError}</p> : null}
      </div>
    </div>
  );
}
