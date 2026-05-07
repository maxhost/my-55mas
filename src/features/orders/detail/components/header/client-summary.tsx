'use client';

import type {
  HeaderHints,
  OrderClientSummary,
} from '@/features/orders/detail/types';

type Props = {
  client: OrderClientSummary;
  hints: HeaderHints;
};

export function ClientSummary({ client, hints }: Props) {
  const parts = [
    client.full_name ?? '—',
    client.email ?? hints.noEmail,
    client.phone ?? hints.noPhone,
  ];

  return (
    <p className="text-sm">
      <span className="text-muted-foreground">{hints.fieldClient}: </span>
      <span>{parts.join(' · ')}</span>
    </p>
  );
}
