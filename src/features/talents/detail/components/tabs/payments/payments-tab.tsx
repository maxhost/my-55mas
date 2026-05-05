'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  PaymentsTabHints,
  TalentPayment,
  TalentPaymentsStats,
} from '@/features/talents/detail/types';
import { MarkAsPaidSheet } from './mark-as-paid-sheet';
import { PaymentDetailSheet } from './payment-detail-sheet';

type Props = {
  talentId: string;
  preferredPayment: string | null;
  initialPayments: TalentPayment[];
  initialStats: TalentPaymentsStats;
  hints: PaymentsTabHints;
  locale: string;
};

export function PaymentsTab({
  talentId,
  preferredPayment,
  initialPayments,
  initialStats,
  hints,
  locale,
}: Props) {
  const router = useRouter();
  const [markPaymentId, setMarkPaymentId] = useState<string | null>(null);
  const [detailPaymentId, setDetailPaymentId] = useState<string | null>(null);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: initialStats.currency,
      }),
    [initialStats.currency],
  );

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }),
    [],
  );

  const formatMonth = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return monthFormatter.format(d);
  };

  const firstPendingPaymentId = useMemo(
    () => initialPayments.find((p) => p.status === 'pending')?.id ?? null,
    [initialPayments],
  );

  const handleSuccess = () => {
    setMarkPaymentId(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs uppercase tracking-wide">
          {hints.preferredPaymentLabel}
        </p>
        <p className="text-sm">{preferredPayment ?? '—'}</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-1 flex-wrap gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">{hints.acumuladoLabel}: </span>
            <span className="font-medium">
              {currencyFormatter.format(initialStats.acumulado)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">{hints.pendienteLabel}: </span>
            <span className="font-medium">
              {currencyFormatter.format(initialStats.pendiente)}
            </span>
            <span className="text-muted-foreground ml-1">
              {hints.pendingOrdersSuffix.replace('{count}', String(initialStats.pendingOrders))}
            </span>
          </div>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={() => firstPendingPaymentId && setMarkPaymentId(firstPendingPaymentId)}
          disabled={!firstPendingPaymentId}
        >
          {hints.markAsPaidButton}
        </Button>
      </div>

      {initialPayments.length === 0 ? (
        <p className="text-muted-foreground text-sm">{hints.empty}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{hints.columnMonth}</TableHead>
              <TableHead>{hints.columnOrders}</TableHead>
              <TableHead>{hints.columnGross}</TableHead>
              <TableHead>{hints.columnCommission}</TableHead>
              <TableHead>{hints.columnNet}</TableHead>
              <TableHead>{hints.columnStatus}</TableHead>
              <TableHead className="text-right">{hints.columnAction}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="capitalize">{formatMonth(payment.period_month)}</TableCell>
                <TableCell>—</TableCell>
                <TableCell>{currencyFormatter.format(payment.total_amount)}</TableCell>
                <TableCell>—</TableCell>
                <TableCell>{currencyFormatter.format(payment.total_amount)}</TableCell>
                <TableCell>{hints.statusLabels[payment.status]}</TableCell>
                <TableCell className="text-right">
                  {payment.status === 'pending' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMarkPaymentId(payment.id)}
                    >
                      {hints.rowMarkPaid}
                    </Button>
                  ) : payment.status === 'paid' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailPaymentId(payment.id)}
                    >
                      {hints.rowViewDetail}
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {markPaymentId !== null && (
        <MarkAsPaidSheet
          open={markPaymentId !== null}
          onOpenChange={(o) => {
            if (!o) setMarkPaymentId(null);
          }}
          paymentId={markPaymentId}
          talentId={talentId}
          hints={hints}
          onSuccess={handleSuccess}
        />
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
