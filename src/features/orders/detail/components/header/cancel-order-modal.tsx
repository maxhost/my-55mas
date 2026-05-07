'use client';

import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { cancelOrder } from '@/features/orders/detail/actions/cancel-order';
import type { HeaderHints } from '@/features/orders/detail/types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  hints: HeaderHints;
  onCancelled: () => void;
};

export function CancelOrderModal({
  open,
  onOpenChange,
  orderId,
  hints,
  onCancelled,
}: Props) {
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();

  // Reset reason when sheet closes.
  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    if (!next) setReason('');
    onOpenChange(next);
  };

  const handleConfirm = () => {
    startTransition(async () => {
      const trimmed = reason.trim();
      const res = await cancelOrder({
        orderId,
        ...(trimmed ? { reason: trimmed } : {}),
      });
      if ('error' in res) {
        toast.error(res.error.message || hints.cancelOrderError);
        return;
      }
      toast.success(hints.cancelOrderSuccess);
      onCancelled();
      handleOpenChange(false);
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{hints.cancelOrderTitle}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <p className="text-sm text-muted-foreground">
            {hints.cancelOrderWarning}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="cancel-order-reason">
              {hints.cancelOrderTitle}
            </Label>
            <Textarea
              id="cancel-order-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            {hints.cancelOrderCancel}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {hints.cancelOrderConfirm}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
