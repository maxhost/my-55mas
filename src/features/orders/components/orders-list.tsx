'use client';

import { useMemo, useState } from 'react';
import { OrdersToolbar } from './orders-toolbar';
import { OrdersTable } from './orders-table';
import type {
  CityOption,
  CountryOption,
  OrderListItem,
  OrderStatus,
  PersonOption,
} from '../types';

type Props = {
  orders: OrderListItem[];
  countryOptions: CountryOption[];
  cityOptions: CityOption[];
  talentOptions: PersonOption[];
  clientOptions: PersonOption[];
  /** Restrict the status filter dropdown. Default = all statuses. */
  statusOptions?: readonly OrderStatus[];
  /** Base path for the row link (default `/admin/orders/`). */
  linkBasePath?: string;
};

export function OrdersList({
  orders,
  countryOptions,
  cityOptions,
  talentOptions,
  clientOptions,
  statusOptions,
  linkBasePath,
}: Props) {
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [talentFilter, setTalentFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleCountryChange = (value: string) => {
    setCountryFilter(value);
    setCityFilter('all');
  };

  const cityOptionsFiltered = useMemo(() => {
    if (countryFilter === 'all') return [];
    return cityOptions.filter((c) => c.country_id === countryFilter);
  }, [cityOptions, countryFilter]);

  const filtered = useMemo(() => {
    let result = orders;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.client_name?.toLowerCase().includes(q) ||
          o.talent_name?.toLowerCase().includes(q) ||
          o.service_name?.toLowerCase().includes(q) ||
          String(o.order_number).includes(q)
      );
    }

    if (countryFilter !== 'all') {
      result = result.filter((o) => o.country_id === countryFilter);
    }
    if (cityFilter !== 'all') {
      result = result.filter((o) => o.city_id === cityFilter);
    }
    if (talentFilter !== 'all') {
      result = result.filter((o) => o.talent_id === talentFilter);
    }
    if (clientFilter !== 'all') {
      result = result.filter((o) => o.client_id === clientFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter);
    }
    if (dateFrom) {
      result = result.filter(
        (o) => o.appointment_date && o.appointment_date.slice(0, 10) >= dateFrom
      );
    }
    if (dateTo) {
      result = result.filter(
        (o) => o.appointment_date && o.appointment_date.slice(0, 10) <= dateTo
      );
    }

    return result;
  }, [orders, search, countryFilter, cityFilter, talentFilter, clientFilter, statusFilter, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <OrdersToolbar
        search={search}
        onSearchChange={setSearch}
        countryFilter={countryFilter}
        onCountryFilterChange={handleCountryChange}
        cityFilter={cityFilter}
        onCityFilterChange={setCityFilter}
        talentFilter={talentFilter}
        onTalentFilterChange={setTalentFilter}
        clientFilter={clientFilter}
        onClientFilterChange={setClientFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        countryOptions={countryOptions}
        cityOptions={cityOptionsFiltered}
        talentOptions={talentOptions}
        clientOptions={clientOptions}
        statusOptions={statusOptions}
      />
      <OrdersTable orders={filtered} linkBasePath={linkBasePath} />
    </div>
  );
}
