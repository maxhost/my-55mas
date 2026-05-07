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
  TalentBillingBlock,
} from '@/features/orders/detail/types';

type Props = {
  orderId: string;
  block: TalentBillingBlock;
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

export function TalentBillingSection({
  orderId,
  block,
  hints,
  locale,
  onAddLineRequested,
  onInvoiced,
}: Props) {
  const [pending, startTransition] = useTransition();

  const fmt = useMemo(
    () => (n: number) => formatCurrency(n, locale, block.currency),
    [locale, block.currency],
  );

  const title = hints.talentSectionTitlePrefix.replace(
    '[name]',
    block.talent_name ?? '—',
  );

  const handleInvoice = () => {
    startTransition(async () => {
      const res = await invoiceOrder({
        orderId,
        scope: 'talent',
        talentId: block.talent_id,
      });
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
        <h3 className="text-base font-semibold">{title}</h3>
        {block.invoiced ? <Badge variant="secondary">{hints.invoicedBadge}</Badge> : null}
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
            {block.lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  {hints.empty}
                </TableCell>
              </TableRow>
            ) : (
              block.lines.map((line) => (
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
            disabled={block.invoiced}
            className="px-0 text-primary"
          >
            <Plus />
            {hints.addLineButton}
          </Button>
        </div>
        <div className="flex min-w-[220px] flex-col gap-1 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{hints.subtotalLabel}</span>
            <span className="font-medium">{fmt(block.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t pt-1">
            <span className="font-semibold">{hints.totalLabel}</span>
            <span className="font-bold">{fmt(block.total)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        {block.invoiced ? null : (
          <Button
            variant="default"
            onClick={handleInvoice}
            disabled={pending || block.lines.length === 0}
          >
            {hints.invoiceButton}
          </Button>
        )}
      </div>
    </section>
  );
}
