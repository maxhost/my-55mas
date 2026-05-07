'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  ClientPayment,
  PaymentsTabHints,
} from '@/features/clients/detail/types';
import { PaymentDetailSheet } from './payment-detail-sheet';

type Props = {
  clientId: string;
  initialPayments: ClientPayment[];
  hints: PaymentsTabHints;
  locale: string;
};

export function PaymentsTab({
  clientId: _clientId,
  initialPayments,
  hints,
  locale,
}: Props) {
  const [detailPaymentId, setDetailPaymentId] = useState<string | null>(null);

  const currency = useMemo(
    () => initialPayments[0]?.currency ?? 'EUR',
    [initialPayments],
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency,
      }),
    [currency],
  );

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale],
  );

  const { acumulado, pendiente } = useMemo(() => {
    let paid = 0;
    let pending = 0;
    for (const p of initialPayments) {
      if (p.status === 'paid') paid += p.total_amount;
      else if (p.status === 'pending' || p.status === 'approved') {
        pending += p.total_amount;
      }
    }
    return { acumulado: paid, pendiente: pending };
  }, [initialPayments]);

  const formatMonth = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return monthFormatter.format(d);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
        <div>
          <span className="text-muted-foreground">{hints.acumuladoLabel}: </span>
          <span className="font-medium">{currencyFormatter.format(acumulado)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">{hints.pendienteLabel}: </span>
          <span className="font-medium">{currencyFormatter.format(pendiente)}</span>
        </div>
      </div>

      {initialPayments.length === 0 ? (
        <p className="text-muted-foreground text-sm">{hints.empty}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{hints.columnMonth}</TableHead>
              <TableHead>{hints.columnOrders}</TableHead>
              <TableHead>{hints.columnTotal}</TableHead>
              <TableHead>{hints.columnStatus}</TableHead>
              <TableHead className="text-right">{hints.columnAction}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="capitalize">
                  {formatMonth(payment.period_month)}
                </TableCell>
                <TableCell>—</TableCell>
                <TableCell>{currencyFormatter.format(payment.total_amount)}</TableCell>
                <TableCell>{hints.statusLabels[payment.status]}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDetailPaymentId(payment.id)}
                  >
                    {hints.rowViewDetail}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {detailPaymentId !== null && (
        <PaymentDetailSheet
          open={detailPaymentId !== null}
          onOpenChange={(o) => {
            if (!o) setDetailPaymentId(null);
          }}
          paymentId={detailPaymentId}
          locale={locale}
          hints={hints}
        />
      )}
    </div>
  );
}
