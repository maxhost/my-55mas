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
  onCountryChange: (id: string) => void;
  onCityChange: (id: string) => void;
  countryLabel: string;
  cityLabel: string;
  countryPlaceholder?: string;
  cityPlaceholder?: string;
  countryError?: string;
  cityError?: string;
  required?: boolean;
  disabled?: boolean;
  countryFieldId?: string;
  cityFieldId?: string;
};

export function CountryCityField({
  countries,
  cities,
  countryValue,
  cityValue,
  onCountryChange,
  onCityChange,
  countryLabel,
  cityLabel,
  countryPlaceholder,
  cityPlaceholder,
  countryError,
  cityError,
  required,
  disabled,
  countryFieldId,
  cityFieldId,
}: Props) {
  const filteredCities = cities.filter((c) => c.country_id === countryValue);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={countryFieldId}>
          {countryLabel}
          {required ? <span aria-hidden> *</span> : null}
        </Label>
        <Select
          value={countryValue}
          onValueChange={(v) => {
            onCountryChange(v ?? '');
            onCityChange('');
          }}
          disabled={disabled}
        >
          <SelectTrigger id={countryFieldId} aria-invalid={countryError ? 'true' : undefined}>
            <SelectValue placeholder={countryPlaceholder}>
              {(v: string) =>
                countries.find((c) => c.id === v)?.name ?? countryPlaceholder ?? ''
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {countryError ? <p className="text-sm text-destructive">{countryError}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={cityFieldId}>
          {cityLabel}
          {required ? <span aria-hidden> *</span> : null}
        </Label>
        <Select
          value={cityValue}
          onValueChange={(v) => onCityChange(v ?? '')}
          disabled={disabled || !countryValue}
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
        {cityError ? <p className="text-sm text-destructive">{cityError}</p> : null}
      </div>
    </div>
  );
}
