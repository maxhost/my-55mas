'use client';

import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OrdersTabHints } from '@/features/talents/detail/types';

const ORDER_STATUSES = [
  'nuevo',
  'buscando_talento',
  'asignado',
  'en_curso',
  'completado',
  'cancelado',
] as const;

export type Period = 'all' | '30d' | '90d' | 'year';

type Props = {
  status: string;
  onStatusChange: (value: string) => void;
  period: Period;
  onPeriodChange: (value: Period) => void;
  serviceName: string;
  onServiceNameChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  serviceOptions: string[];
  hints: OrdersTabHints;
};

export function OrdersToolbar({
  status,
  onStatusChange,
  period,
  onPeriodChange,
  serviceName,
  onServiceNameChange,
  search,
  onSearchChange,
  serviceOptions,
  hints,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={status} onValueChange={(v) => onStatusChange(v ?? 'all')}>
        <SelectTrigger>
          <SelectValue placeholder={hints.filterStatus} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{hints.filterStatus}</SelectItem>
          {ORDER_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={period} onValueChange={(v) => onPeriodChange((v as Period) ?? 'all')}>
        <SelectTrigger>
          <SelectValue placeholder={hints.filterPeriod} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{hints.filterPeriod}</SelectItem>
          <SelectItem value="30d">30d</SelectItem>
          <SelectItem value="90d">90d</SelectItem>
          <SelectItem value="year">year</SelectItem>
        </SelectContent>
      </Select>

      <Select value={serviceName} onValueChange={(v) => onServiceNameChange(v ?? 'all')}>
        <SelectTrigger>
          <SelectValue placeholder={hints.filterService} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{hints.filterService}</SelectItem>
          {serviceOptions.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative max-w-sm flex-1">
        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder={hints.searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
