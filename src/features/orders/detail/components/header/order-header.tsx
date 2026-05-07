'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  HeaderHints,
  OrderDetail,
  OrderTagOption,
} from '@/features/orders/detail/types';
import { CancelOrderModal } from './cancel-order-modal';
import { ClientSummary } from './client-summary';
import { OrderStatusSelect } from './order-status-select';
import { OrderTagsDisplay } from './order-tags-display';

type Props = {
  order: OrderDetail;
  availableTags: OrderTagOption[];
  hints: HeaderHints;
  locale: string;
  onStatusChanged: () => void;
  onTagsChanged: () => void;
  onCancelled: () => void;
  readOnly?: boolean;
};

function formatDuration(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDate(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatTimeRange(
  start: string | null,
  end: string | null,
): string | null {
  if (!start && !end) return null;
  if (start && end) return `${start} – ${end}`;
  return start ?? end;
}

function formatCurrency(
  amount: number,
  currency: string,
  locale: string,
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

type MetaItemProps = { label: string; children: React.ReactNode };

function MetaItem({ label, children }: MetaItemProps) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}:
      </span>
      <span className="text-foreground">{children}</span>
    </div>
  );
}

export function OrderHeader({
  order,
  availableTags,
  hints,
  locale,
  onStatusChanged,
  onTagsChanged,
  onCancelled,
  readOnly = false,
}: Props) {
  const [cancelOpen, setCancelOpen] = useState(false);

  const duration = formatDuration(order.estimated_duration_minutes);
  const appointmentDate = formatDate(order.appointment_date, locale);
  const timeRange = formatTimeRange(order.start_time, order.end_time);
  const createdAt = formatDate(order.created_at, locale);
  const totalText = formatCurrency(order.price_total, order.currency, locale);

  const paymentStatusLabel = order.payment_status
    ? hints.paymentStatusLabels[order.payment_status] ?? order.payment_status
    : '—';

  return (
    <div className="flex flex-col gap-3 px-6 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="font-heading text-xl font-semibold leading-tight">
            <span className="text-muted-foreground">#{order.order_number}</span>
            <span className="text-muted-foreground"> · </span>
            <span>{order.service_name ?? '—'}</span>
          </h1>
        </div>
        {!readOnly && (
          <div className="flex shrink-0 items-start">
            <Button
              variant="destructive"
              onClick={() => setCancelOpen(true)}
            >
              {hints.cancelOrderButton}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            {hints.fieldStatus}:
          </span>
          <OrderStatusSelect
            orderId={order.id}
            status={order.status}
            statusLabels={hints.statusLabels}
            hints={hints}
            onStatusChanged={onStatusChanged}
          />
        </div>
        <MetaItem label={hints.fieldPaymentStatus}>
          <Badge variant="outline">{paymentStatusLabel}</Badge>
        </MetaItem>
        <MetaItem label={hints.fieldStaff}>
          {order.staff_member?.full_name ?? hints.noStaff}
        </MetaItem>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <MetaItem label={hints.fieldDuration}>
          {duration ?? '—'}
        </MetaItem>
        <MetaItem label={hints.fieldAppointmentDate}>
          {appointmentDate ?? '—'}
        </MetaItem>
        <MetaItem label={hints.fieldSchedule}>
          {timeRange ?? '—'}
        </MetaItem>
        <MetaItem label={hints.fieldTotal}>
          <span>
            {totalText}
            <span className="text-muted-foreground ml-1 text-xs">
              ({hints.fieldTotalSuffix})
            </span>
          </span>
        </MetaItem>
        <MetaItem label={hints.fieldCreatedAt}>
          {createdAt ?? '—'}
        </MetaItem>
      </div>

      {readOnly ? (
        <div className="flex flex-wrap items-center gap-2">
          {order.tags.map((tag) => (
            <Badge key={tag.id} variant="outline">
              {tag.name}
            </Badge>
          ))}
        </div>
      ) : (
        <OrderTagsDisplay
          orderId={order.id}
          assignedTags={order.tags}
          availableTags={availableTags}
          hints={hints}
          onTagsChanged={onTagsChanged}
        />
      )}

      <ClientSummary client={order.client} hints={hints} />

      <CancelOrderModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        orderId={order.id}
        hints={hints}
        onCancelled={onCancelled}
      />
    </div>
  );
}
