'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { ORDER_STATUSES } from '../types';
import type { CountryOption, CityOption, OrderStatus, PersonOption } from '../types';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  countryFilter: string;
  onCountryFilterChange: (value: string) => void;
  cityFilter: string;
  onCityFilterChange: (value: string) => void;
  talentFilter: string;
  onTalentFilterChange: (value: string) => void;
  clientFilter: string;
  onClientFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  countryOptions: CountryOption[];
  cityOptions: CityOption[];
  talentOptions: PersonOption[];
  clientOptions: PersonOption[];
  /** Restrict the status filter dropdown to this subset. Default = all statuses. */
  statusOptions?: readonly OrderStatus[];
};

export function OrdersToolbar({
  search,
  onSearchChange,
  countryFilter,
  onCountryFilterChange,
  cityFilter,
  onCityFilterChange,
  talentFilter,
  onTalentFilterChange,
  clientFilter,
  onClientFilterChange,
  statusFilter,
  onStatusFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  countryOptions,
  cityOptions,
  talentOptions,
  clientOptions,
  statusOptions,
}: Props) {
  const visibleStatuses = statusOptions ?? ORDER_STATUSES;
  const t = useTranslations('AdminOrders');

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Search */}
      <div className="relative max-w-sm flex-1">
        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Country */}
      <Select value={countryFilter} onValueChange={(val) => onCountryFilterChange(val ?? 'all')}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={t('filterByCountry')}>
            {countryFilter === 'all' ? t('allCountries') : countryOptions.find((c) => c.id === countryFilter)?.name ?? t('allCountries')}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allCountries')}</SelectItem>
          {countryOptions.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* City */}
      <Select
        value={cityFilter}
        onValueChange={(val) => onCityFilterChange(val ?? 'all')}
        disabled={countryFilter === 'all'}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={t('filterByCity')}>
            {cityFilter === 'all' ? t('allCities') : cityOptions.find((c) => c.id === cityFilter)?.name ?? t('allCities')}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allCities')}</SelectItem>
          {cityOptions.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Client */}
      <Select value={clientFilter} onValueChange={(val) => onClientFilterChange(val ?? 'all')}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={t('filterByClient')}>
            {clientFilter === 'all' ? t('allClients') : clientOptions.find((p) => p.id === clientFilter)?.name ?? t('allClients')}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allClients')}</SelectItem>
          {clientOptions.map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Talent */}
      <Select value={talentFilter} onValueChange={(val) => onTalentFilterChange(val ?? 'all')}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={t('filterByTalent')}>
            {talentFilter === 'all' ? t('allTalents') : talentOptions.find((p) => p.id === talentFilter)?.name ?? t('allTalents')}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allTalents')}</SelectItem>
          {talentOptions.map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status */}
      <Select value={statusFilter} onValueChange={(val) => onStatusFilterChange(val ?? 'all')}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={t('filterByStatus')}>
            {statusFilter === 'all' ? t('allStatuses') : t(statusFilter as 'pendiente')}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allStatuses')}</SelectItem>
          {visibleStatuses.map((s) => (
            <SelectItem key={s} value={s}>{t(s)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date from */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">{t('dateFrom')}</span>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="w-[150px]"
        />
      </div>

      {/* Date to */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">{t('dateTo')}</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="w-[150px]"
        />
      </div>
    </div>
  );
}
