'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateOrderStatus } from '@/features/orders/detail/actions/update-order-status';
import type {
  HeaderHints,
  OrderStatusLabels,
} from '@/features/orders/detail/types';
import { ORDER_STATUSES, type OrderStatus } from '@/features/orders/types';

type Props = {
  orderId: string;
  status: OrderStatus;
  statusLabels: OrderStatusLabels;
  hints: HeaderHints;
  onStatusChanged: () => void;
};

export function OrderStatusSelect({
  orderId,
  status,
  statusLabels,
  hints,
  onStatusChanged,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (next: string | null) => {
    if (!next || next === status) return;
    const nextStatus = next as OrderStatus;
    startTransition(async () => {
      const res = await updateOrderStatus({ orderId, status: nextStatus });
      if ('error' in res) {
        toast.error(res.error.message || hints.statusUpdateError);
        return;
      }
      toast.success(hints.statusUpdateSuccess);
      onStatusChanged();
    });
  };

  return (
    <Select
      value={status}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger size="sm" className="h-8 min-w-[10rem]">
        <SelectValue>
          {(v: string) =>
            statusLabels[v as OrderStatus] ?? statusLabels[status]
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {statusLabels[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
