'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { getTalentOrders } from '@/features/talents/detail/actions/get-talent-orders';
import type { OrdersTabHints, TalentOrderRow } from '@/features/talents/detail/types';

import { OrdersTable } from './orders-table';
import { OrdersToolbar, type Period } from './orders-toolbar';

const PAGE_SIZE = 50;

type Props = {
  talentId: string;
  initialOrders: TalentOrderRow[];
  totalCount: number;
  hints: OrdersTabHints;
  locale: string;
};

function periodToFromDate(period: Period): string | null {
  if (period === 'all') return null;
  const now = new Date();
  const days = period === '30d' ? 30 : period === '90d' ? 90 : 365;
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return from.toISOString().slice(0, 10);
}

function fillPageInfo(template: string, from: number, to: number, total: number): string {
  return template
    .replace('{from}', String(from))
    .replace('{to}', String(to))
    .replace('{total}', String(total));
}

export function OrdersTab({ talentId, initialOrders, totalCount, hints, locale }: Props) {
  const [orders, setOrders] = useState<TalentOrderRow[]>(initialOrders);
  const [count, setCount] = useState<number>(totalCount);
  const [page, setPage] = useState<number>(0);
  const [status, setStatus] = useState<string>('all');
  const [period, setPeriod] = useState<Period>('all');
  const [serviceName, setServiceName] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const isFirstRun = useRef(true);

  // Debounce search input by 300ms before triggering refetch.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Build distinct service-name options from initial dataset (no separate action).
  const serviceOptions = useMemo(() => {
    const set = new Set<string>();
    for (const o of initialOrders) {
      if (o.service_name) set.add(o.service_name);
    }
    return Array.from(set).sort();
  }, [initialOrders]);

  // Refetch on page / status / period / debounced search changes.
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const fromDate = periodToFromDate(period);
    startTransition(async () => {
      try {
        const res = await getTalentOrders(
          {
            talentId,
            page,
            pageSize: PAGE_SIZE,
            status: status === 'all' ? null : status,
            fromDate,
            toDate: null,
            search: debouncedSearch || null,
          },
          locale,
        );
        setOrders(res.rows);
        setCount(res.totalCount);
      } catch {
        toast.error(hints.loadingError);
      }
    });
  }, [talentId, locale, page, status, period, debouncedSearch, hints.loadingError]);

  // Reset to page 0 whenever a filter (other than page itself) changes.
  useEffect(() => {
    setPage(0);
  }, [status, period, debouncedSearch, serviceName]);

  // Service filter is applied client-side because TalentOrderRow does not expose
  // service_id (the action only accepts uuid for serviceId). KEEP IT SIMPLE per spec.
  const visibleOrders = useMemo(() => {
    if (serviceName === 'all') return orders;
    return orders.filter((o) => o.service_name === serviceName);
  }, [orders, serviceName]);

  const from = count === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, count);
  const hasPrev = page > 0;
  const hasNext = (page + 1) * PAGE_SIZE < count;

  return (
    <div className="space-y-4">
      <OrdersToolbar
        status={status}
        onStatusChange={setStatus}
        period={period}
        onPeriodChange={setPeriod}
        serviceName={serviceName}
        onServiceNameChange={setServiceName}
        search={search}
        onSearchChange={setSearch}
        serviceOptions={serviceOptions}
        hints={hints}
      />

      <OrdersTable
        orders={visibleOrders}
        isPending={isPending}
        locale={locale}
        hints={hints}
      />

      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {fillPageInfo(hints.pageInfo, from, to, count)}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrev || isPending}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext || isPending}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
