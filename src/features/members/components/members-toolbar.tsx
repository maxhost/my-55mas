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
import type { CountryOption, CityOption, TeamOption } from '../types';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  countryFilter: string;
  onCountryFilterChange: (value: string) => void;
  cityFilter: string;
  onCityFilterChange: (value: string) => void;
  teamFilter: string;
  onTeamFilterChange: (value: string) => void;
  countryOptions: CountryOption[];
  cityOptions: CityOption[];
  teamOptions: TeamOption[];
};

export function MembersToolbar({
  search,
  onSearchChange,
  countryFilter,
  onCountryFilterChange,
  cityFilter,
  onCityFilterChange,
  teamFilter,
  onTeamFilterChange,
  countryOptions,
  cityOptions,
  teamOptions,
}: Props) {
  const t = useTranslations('AdminMembers');

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative max-w-sm flex-1">
        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={countryFilter} onValueChange={(val) => onCountryFilterChange(val ?? 'all')}>
        <SelectTrigger>
          <SelectValue placeholder={t('filterByCountry')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allCountries')}</SelectItem>
          {countryOptions.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={cityFilter}
        onValueChange={(val) => onCityFilterChange(val ?? 'all')}
        disabled={countryFilter === 'all'}
      >
        <SelectTrigger>
          <SelectValue placeholder={t('filterByCity')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allCities')}</SelectItem>
          {cityOptions.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={teamFilter} onValueChange={(val) => onTeamFilterChange(val ?? 'all')}>
        <SelectTrigger>
          <SelectValue placeholder={t('filterByTeam')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allTeams')}</SelectItem>
          {teamOptions.map((t) => (
            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
