'use client';

import { useMemo, useState } from 'react';
import { ClientsToolbar } from './clients-toolbar';
import { ClientsTable } from './clients-table';
import type { ClientListItem, CountryOption, CityOption } from '../types';

type Props = {
  clients: ClientListItem[];
  countryOptions: CountryOption[];
  cityOptions: CityOption[];
};

export function ClientsList({ clients, countryOptions, cityOptions }: Props) {
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');

  const handleCountryChange = (value: string) => {
    setCountryFilter(value);
    setCityFilter('all');
  };

  const cityOptionsFiltered = useMemo(() => {
    if (countryFilter === 'all') return [];
    return cityOptions.filter((c) => c.country_id === countryFilter);
  }, [cityOptions, countryFilter]);

  const filtered = useMemo(() => {
    let result = clients;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.full_name?.toLowerCase().includes(q));
    }

    if (countryFilter !== 'all') {
      result = result.filter((c) => c.country_id === countryFilter);
    }

    if (cityFilter !== 'all') {
      result = result.filter((c) => c.city_id === cityFilter);
    }

    if (companyFilter === 'with') {
      result = result.filter((c) => c.company_name !== null);
    } else if (companyFilter === 'without') {
      result = result.filter((c) => c.company_name === null);
    }

    return result;
  }, [clients, search, countryFilter, cityFilter, companyFilter]);

  return (
    <div className="space-y-6">
      <ClientsToolbar
        search={search}
        onSearchChange={setSearch}
        countryFilter={countryFilter}
        onCountryFilterChange={handleCountryChange}
        cityFilter={cityFilter}
        onCityFilterChange={setCityFilter}
        companyFilter={companyFilter}
        onCompanyFilterChange={setCompanyFilter}
        countryOptions={countryOptions}
        cityOptions={cityOptionsFiltered}
      />
      <ClientsTable clients={filtered} />
    </div>
  );
}
