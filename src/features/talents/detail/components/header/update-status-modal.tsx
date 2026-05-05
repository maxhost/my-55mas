'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { TALENT_STATUSES, type TalentStatus } from '@/features/talents/types';
import { updateTalentStatus } from '@/features/talents/detail/actions/update-talent-status';
import type { HeaderHints } from '@/features/talents/detail/types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talentId: string;
  currentStatus: TalentStatus;
  hints: HeaderHints;
  onStatusChanged: () => void;
};

export function UpdateStatusModal({
  open,
  onOpenChange,
  talentId,
  currentStatus,
  hints,
  onStatusChanged,
}: Props) {
  const [status, setStatus] = useState<TalentStatus>(currentStatus);
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setStatus(currentStatus);
      setReason('');
    }
    onOpenChange(next);
  };

  const handleConfirm = () => {
    startTransition(async () => {
      const trimmed = reason.trim();
      const result = await updateTalentStatus({
        talentId,
        status,
        ...(trimmed ? { reason: trimmed } : {}),
      });
      if ('error' in result) {
        toast.error(result.error.message || hints.updateStatusError);
        return;
      }
      toast.success(hints.updateStatusSuccess);
      onStatusChanged();
      handleOpenChange(false);
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{hints.updateStatusTitle}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="space-y-1.5">
            <Label>{hints.updateStatusSelectLabel}</Label>
            <Select
              value={status}
              onValueChange={(v) => v && setStatus(v as TalentStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) =>
                    hints.statusLabels[v as TalentStatus] ?? v
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TALENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {hints.statusLabels[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status-reason">{hints.updateStatusReasonLabel}</Label>
            <Textarea
              id="status-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={hints.updateStatusReasonPlaceholder}
              rows={4}
            />
          </div>
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            {hints.updateStatusCancel}
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {hints.updateStatusConfirm}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
