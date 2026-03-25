'use client';

import { Dialog } from '@base-ui/react/dialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
  isPending?: boolean;
  error?: string | null;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  variant = 'default',
  isPending = false,
  error,
}: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className="fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs"
        />
        <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border bg-popover p-6 text-popover-foreground shadow-lg">
            <Dialog.Title className="font-heading text-base font-medium text-foreground">
              {title}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              {description}
            </Dialog.Description>

            {error && (
              <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close
                render={
                  <Button variant="ghost" disabled={isPending} />
                }
              >
                {cancelLabel}
              </Dialog.Close>
              <Button
                variant={variant === 'destructive' ? 'destructive' : 'default'}
                disabled={isPending}
                onClick={onConfirm}
              >
                {isPending ? (
                  <span className="flex items-center gap-1.5">
                    <span className={cn(
                      'inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent',
                    )} />
                    {confirmLabel}
                  </span>
                ) : (
                  confirmLabel
                )}
              </Button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
