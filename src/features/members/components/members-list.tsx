'use client';

import { useMemo, useState } from 'react';
import { MembersToolbar } from './members-toolbar';
import { MembersTable } from './members-table';
import { CreateMemberSheet } from './create-member-sheet';
import { CreateTeamSheet } from './create-team-sheet';
import type {
  MemberListItem,
  CountryOption,
  CityOption,
  TeamOption,
  RoleOption,
} from '../types';

type Props = {
  members: MemberListItem[];
  countryOptions: CountryOption[];
  cityOptions: CityOption[];
  teamOptions: TeamOption[];
  roleOptions: RoleOption[];
};

export function MembersList({
  members,
  countryOptions,
  cityOptions,
  teamOptions,
  roleOptions,
}: Props) {
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');

  const handleCountryChange = (value: string) => {
    setCountryFilter(value);
    setCityFilter('all');
  };

  const cityOptionsFiltered = useMemo(() => {
    if (countryFilter === 'all') return [];
    return cityOptions.filter((c) => c.country_id === countryFilter);
  }, [cityOptions, countryFilter]);

  const filtered = useMemo(() => {
    let result = members;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.full_name?.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q),
      );
    }

    if (countryFilter !== 'all') {
      result = result.filter((m) => m.country_id === countryFilter);
    }

    if (cityFilter !== 'all') {
      result = result.filter((m) => m.city_id === cityFilter);
    }

    if (teamFilter !== 'all') {
      result = result.filter((m) => m.teams.some((t) => t.id === teamFilter));
    }

    return result;
  }, [members, search, countryFilter, cityFilter, teamFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <CreateMemberSheet
          countryOptions={countryOptions}
          cityOptions={cityOptions}
          teamOptions={teamOptions}
          roleOptions={roleOptions}
        />
        <CreateTeamSheet />
      </div>
      <MembersToolbar
        search={search}
        onSearchChange={setSearch}
        countryFilter={countryFilter}
        onCountryFilterChange={handleCountryChange}
        cityFilter={cityFilter}
        onCityFilterChange={setCityFilter}
        teamFilter={teamFilter}
        onTeamFilterChange={setTeamFilter}
        countryOptions={countryOptions}
        cityOptions={cityOptionsFiltered}
        teamOptions={teamOptions}
      />
      <MembersTable members={filtered} />
    </div>
  );
}
