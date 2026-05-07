'use client';

import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { deleteClient } from '@/features/clients/detail/actions/delete-client';
import type { HeaderHints } from '@/features/clients/detail/types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientFullName: string | null;
  hints: HeaderHints;
  onDeleted: () => void;
};

export function DeleteClientModal({
  open,
  onOpenChange,
  clientId,
  clientFullName,
  hints,
  onDeleted,
}: Props) {
  const [confirmName, setConfirmName] = useState('');
  const [isPending, startTransition] = useTransition();

  // Reset input when sheet closes.
  useEffect(() => {
    if (!open) setConfirmName('');
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    if (!next) setConfirmName('');
    onOpenChange(next);
  };

  const expected = clientFullName ?? '';
  const matches = expected.length > 0 && confirmName === expected;

  const handleConfirm = () => {
    if (!matches) return;
    startTransition(async () => {
      const res = await deleteClient({ clientId, confirmName });
      if ('error' in res) {
        toast.error(res.error.message || hints.deleteError);
        return;
      }
      toast.success(hints.deleteSuccess);
      onDeleted();
      handleOpenChange(false);
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{hints.deleteTitle}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <p className="text-sm text-muted-foreground">{hints.deleteWarning}</p>
          <div className="space-y-1.5">
            <Label htmlFor="delete-confirm-input">
              {hints.deleteConfirmInputLabel}
            </Label>
            <Input
              id="delete-confirm-input"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={hints.deleteConfirmInputPlaceholder}
              autoComplete="off"
            />
          </div>
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            {hints.deleteCancel}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!matches || isPending}
          >
            {hints.deleteConfirm}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
