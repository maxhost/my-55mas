'use client';

import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateInTz } from '@/shared/lib/datetime';
import type { OrdersTabHints, TalentOrderRow } from '@/features/talents/detail/types';

type Props = {
  orders: TalentOrderRow[];
  isPending: boolean;
  locale: string;
  hints: OrdersTabHints;
};

export function OrdersTable({ orders, isPending, locale, hints }: Props) {
  const fmtCurrency = (amount: number | null, currency: string | null) => {
    if (amount === null || amount === undefined) return '—';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency ?? 'EUR',
    }).format(amount);
  };
  const fmtDate = (iso: string | null, tz: string) =>
    iso ? formatDateInTz(iso, tz, locale) : '—';

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{hints.columnNumber}</TableHead>
          <TableHead>{hints.columnDate}</TableHead>
          <TableHead>{hints.columnService}</TableHead>
          <TableHead>{hints.columnClient}</TableHead>
          <TableHead>{hints.columnStatus}</TableHead>
          <TableHead>{hints.columnPayment}</TableHead>
          <TableHead className="text-right">{hints.columnTalentAmount}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isPending ? (
          <TableRow>
            <TableCell colSpan={7} className="text-muted-foreground py-6 text-center">
              ...
            </TableCell>
          </TableRow>
        ) : orders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-muted-foreground py-6 text-center">
              {hints.empty}
            </TableCell>
          </TableRow>
        ) : (
          orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell>
                <Link
                  href={`/${locale}/admin/orders/${o.id}`}
                  className="text-primary hover:underline"
                >
                  {o.order_number}
                </Link>
              </TableCell>
              <TableCell>{fmtDate(o.appointment_date, o.timezone)}</TableCell>
              <TableCell>{o.service_name ?? '—'}</TableCell>
              <TableCell>{o.client_name ?? '—'}</TableCell>
              <TableCell>{o.status}</TableCell>
              <TableCell>{o.payment_status ?? '—'}</TableCell>
              <TableCell className="text-right">
                {fmtCurrency(o.talent_amount, o.currency)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
