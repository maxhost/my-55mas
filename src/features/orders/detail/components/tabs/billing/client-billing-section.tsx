'use client';

import { useMemo, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { invoiceOrder } from '@/features/orders/detail/actions/invoice-order';
import type {
  BillingTabHints,
  ClientBillingState,
} from '@/features/orders/detail/types';

type Props = {
  orderId: string;
  state: ClientBillingState;
  hints: BillingTabHints;
  locale: string;
  onAddLineRequested: () => void;
  onInvoiced: () => void;
};

function formatCurrency(value: number, locale: string, currency: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function ClientBillingSection({
  orderId,
  state,
  hints,
  locale,
  onAddLineRequested,
  onInvoiced,
}: Props) {
  const [pending, startTransition] = useTransition();

  const fmt = useMemo(
    () => (n: number) => formatCurrency(n, locale, state.currency),
    [locale, state.currency],
  );

  const ratePct = `${(state.tax_rate * 100).toFixed(0)}%`;

  const handleInvoice = () => {
    startTransition(async () => {
      const res = await invoiceOrder({ orderId, scope: 'client', talentId: null });
      if ('error' in res) {
        toast.error(res.error.message || hints.invoiceError);
        return;
      }
      toast.success(hints.invoiceSuccess);
      onInvoiced();
    });
  };

  return (
    <section className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{hints.clientSectionTitle}</h3>
        {state.invoiced ? <Badge variant="secondary">{hints.invoicedBadge}</Badge> : null}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
        <span>
          {hints.totalPaidLabel}: <span className="font-medium text-foreground">{fmt(state.total_paid)}</span>
        </span>
        <span className="text-muted-foreground">|</span>
        <span>
          {hints.totalOwedLabel}: <span className="font-medium text-foreground">{fmt(state.total_owed)}</span>
        </span>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{hints.columnService}</TableHead>
              <TableHead className="text-right">{hints.columnUnitPrice}</TableHead>
              <TableHead className="text-right">{hints.columnQty}</TableHead>
              <TableHead className="text-right">{hints.columnDiscount}</TableHead>
              <TableHead className="text-right">{hints.columnPrice}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  {hints.empty}
                </TableCell>
              </TableRow>
            ) : (
              state.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-medium">{line.description}</TableCell>
                  <TableCell className="text-right">{fmt(line.unit_price)}</TableCell>
                  <TableCell className="text-right">{line.qty}</TableCell>
                  <TableCell className="text-right">
                    {line.discount_pct ? `${line.discount_pct.toFixed(0)}%` : '—'}
                  </TableCell>
                  <TableCell className="text-right">{fmt(line.total)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button
            variant="link"
            size="sm"
            onClick={onAddLineRequested}
            disabled={state.invoiced}
            className="px-0 text-primary"
          >
            <Plus />
            {hints.addLineButton}
          </Button>
        </div>
        <div className="flex min-w-[220px] flex-col gap-1 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{hints.subtotalLabel}</span>
            <span className="font-medium">{fmt(state.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{`${hints.vatLabel} (${ratePct})`}</span>
            <span className="font-medium">{fmt(state.tax_amount)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t pt-1">
            <span className="font-semibold">{hints.totalLabel}</span>
            <span className="font-bold">{fmt(state.total)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        {state.invoiced ? null : (
          <Button
            variant="default"
            onClick={handleInvoice}
            disabled={pending || state.lines.length === 0}
          >
            {hints.invoiceButton}
          </Button>
        )}
      </div>
    </section>
  );
}
