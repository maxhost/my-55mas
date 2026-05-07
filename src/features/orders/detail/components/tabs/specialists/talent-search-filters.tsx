'use client';

import { useMemo } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  CityRef,
  CountryRef,
  ServiceOption,
  TalentSearchFilters as Filters,
  TalentSearchFiltersHints,
} from '@/features/orders/detail/types';

const NONE_VALUE = '__none__';

type Props = {
  values: Filters;
  onChange: (next: Filters) => void;
  onClear: () => void;
  countries: CountryRef[];
  cities: CityRef[]; // unfiltered; this component filters by selected country
  services: ServiceOption[];
  hints: TalentSearchFiltersHints;
};

type Option = { value: string; label: string };

function FilterSelect({
  label,
  value,
  options,
  notProvided,
  onChange,
  disabled,
}: {
  label: string;
  value: string | null;
  options: Option[];
  notProvided: string;
  onChange: (next: string | null) => void;
  disabled?: boolean;
}) {
  const labelMap = useMemo(() => new Map(options.map((o) => [o.value, o.label])), [options]);
  const trigger = value && labelMap.has(value) ? value : NONE_VALUE;
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      <Select
        value={trigger}
        onValueChange={(v) => onChange(v === NONE_VALUE ? null : (v ?? null))}
        disabled={disabled}
      >
        <SelectTrigger className="min-w-[140px]">
          <SelectValue placeholder={notProvided}>
            {(v) =>
              v === NONE_VALUE || !v
                ? notProvided
                : labelMap.get(v as string) ?? notProvided
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>{notProvided}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function TalentSearchFilters({
  values,
  onChange,
  onClear,
  countries,
  cities,
  services,
  hints,
}: Props) {
  const countryOptions = useMemo<Option[]>(
    () => countries.map((c) => ({ value: c.id, label: c.name })),
    [countries],
  );

  const cityOptions = useMemo<Option[]>(
    () =>
      values.countryId
        ? cities
            .filter((c) => c.country_id === values.countryId)
            .map((c) => ({ value: c.id, label: c.name }))
        : [],
    [cities, values.countryId],
  );

  const serviceOptions = useMemo<Option[]>(
    () => services.map((s) => ({ value: s.id, label: s.name })),
    [services],
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Search input (full width) */}
      <div className="relative w-full">
        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          type="text"
          value={values.query}
          onChange={(e) => onChange({ ...values, query: e.target.value })}
          placeholder={hints.searchPlaceholder}
          className="pl-9"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-end gap-3">
        <span className="text-muted-foreground self-end pb-2 text-sm">
          {hints.filtersLabel}
        </span>

        <FilterSelect
          label={hints.filterCountry}
          value={values.countryId}
          options={countryOptions}
          notProvided={hints.notProvided}
          onChange={(v) => onChange({ ...values, countryId: v, cityId: null })}
        />

        <FilterSelect
          label={hints.filterCity}
          value={values.cityId}
          options={cityOptions}
          notProvided={hints.notProvided}
          onChange={(v) => onChange({ ...values, cityId: v })}
          disabled={!values.countryId}
        />

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs" htmlFor="tsf-postal">
            {hints.filterPostalCode}
          </Label>
          <Input
            id="tsf-postal"
            type="text"
            value={values.postalCode}
            onChange={(e) => onChange({ ...values, postalCode: e.target.value })}
            placeholder={hints.postalCodePlaceholder}
            className="min-w-[120px]"
          />
        </div>

        <FilterSelect
          label={hints.filterService}
          value={values.serviceId}
          options={serviceOptions}
          notProvided={hints.notProvided}
          onChange={(v) => onChange({ ...values, serviceId: v })}
        />

        <Button variant="ghost" size="sm" onClick={onClear}>
          <RotateCcw />
          {hints.clearFilters}
        </Button>
      </div>
    </div>
  );
}
