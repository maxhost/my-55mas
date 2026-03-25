'use client';

import { useMemo, useState } from 'react';
import type { ServiceListItem } from '../types';
import { ServicesToolbar } from './services-toolbar';
import { ServicesTable } from './services-table';

type Props = {
  services: ServiceListItem[];
};

export function ServicesList({ services }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return services;
    const q = search.toLowerCase();
    return services.filter((s) => s.name.toLowerCase().includes(q));
  }, [services, search]);

  return (
    <div className="space-y-6">
      <ServicesToolbar search={search} onSearchChange={setSearch} />
      <ServicesTable services={filtered} />
    </div>
  );
}
