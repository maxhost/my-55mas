'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getPaymentDetail } from '@/features/clients/detail/actions/get-payment-detail';
import type {
  ClientPaymentDetail,
  PaymentsTabHints,
} from '@/features/clients/detail/types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string;
  locale: string;
  hints: PaymentsTabHints;
};

export function PaymentDetailSheet({
  open,
  onOpenChange,
  paymentId,
  locale,
  hints,
}: Props) {
  const [detail, setDetail] = useState<ClientPaymentDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setDetail(null);
    getPaymentDetail(paymentId, locale)
      .then((res) => {
        if (!cancelled) setDetail(res);
      })
      .catch(() => {
        if (!cancelled) toast.error(hints.detailTitle);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, paymentId, locale, hints.detailTitle]);

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale],
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    [locale],
  );

  const currencyFormatter = useMemo(() => {
    const currency = detail?.currency ?? 'EUR';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency });
  }, [detail?.currency]);

  const formatDate = (iso: string | null): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return dateFormatter.format(d);
  };

  const formatMonth = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return monthFormatter.format(d);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{hints.detailTitle}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-6">
          {loading && <p className="text-muted-foreground text-sm">…</p>}

          {!loading && detail && (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase">
                    {hints.columnMonth}
                  </p>
                  <p className="capitalize">{formatMonth(detail.period_month)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">
                    {hints.columnTotal}
                  </p>
                  <p>{currencyFormatter.format(detail.total_amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">
                    {hints.columnStatus}
                  </p>
                  <p>{hints.statusLabels[detail.status]}</p>
                </div>
                {detail.paid_at && (
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">paid_at</p>
                    <p>{formatDate(detail.paid_at)}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">{hints.detailItemsLabel}</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>{hints.columnMonth}</TableHead>
                      <TableHead>service</TableHead>
                      <TableHead className="text-right">{hints.columnTotal}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Link
                            href={`/admin/orders/${item.order_id}`}
                            className="text-primary hover:underline"
                          >
                            #{item.order_number}
                          </Link>
                        </TableCell>
                        <TableCell>{formatDate(item.appointment_date)}</TableCell>
                        <TableCell>{item.service_name ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          {currencyFormatter.format(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                {detail.proof_signed_url ? (
                  <a
                    href={detail.proof_signed_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary text-sm hover:underline"
                  >
                    {hints.detailDownloadProof}
                  </a>
                ) : (
                  <p className="text-muted-foreground text-sm">{hints.detailNoProof}</p>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
