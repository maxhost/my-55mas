'use client';

import { useMemo, useState } from 'react';
import { TalentsToolbar } from './talents-toolbar';
import { TalentsTable } from './talents-table';
import type { TalentListItem, CountryOption, CityOption } from '../types';

type Props = {
  talents: TalentListItem[];
  countryOptions: CountryOption[];
  cityOptions: CityOption[];
};

export function TalentsList({ talents, countryOptions, cityOptions }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

  const handleCountryChange = (value: string) => {
    setCountryFilter(value);
    setCityFilter('all');
  };

  const cityOptionsFiltered = useMemo(() => {
    if (countryFilter === 'all') return [];
    return cityOptions.filter((c) => c.country_id === countryFilter);
  }, [cityOptions, countryFilter]);

  const filtered = useMemo(() => {
    let result = talents;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.full_name?.toLowerCase().includes(q));
    }

    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (countryFilter !== 'all') {
      result = result.filter((t) => t.country_id === countryFilter);
    }

    if (cityFilter !== 'all') {
      result = result.filter((t) => t.city_id === cityFilter);
    }

    return result;
  }, [talents, search, statusFilter, countryFilter, cityFilter]);

  return (
    <div className="space-y-6">
      <TalentsToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        countryFilter={countryFilter}
        onCountryFilterChange={handleCountryChange}
        cityFilter={cityFilter}
        onCityFilterChange={setCityFilter}
        countryOptions={countryOptions}
        cityOptions={cityOptionsFiltered}
      />
      <TalentsTable talents={filtered} />
    </div>
  );
}
