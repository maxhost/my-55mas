'use client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: string;
  currentEmail: string | null | undefined;
  newEmail: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
};

// Dialogo de confirmación antes de disparar supabase.auth.updateUser.
// El user ve title + body (configurados per-locale en option_labels del
// field) + comparación old/new email + botones.
// Confirmar → onConfirm (el caller cierra el dialog + persiste el cambio).
// Cancelar / ESC / backdrop → onOpenChange(false) (el caller revierte el
// input state al email original). La separación deja que el caller distinga
// entre "cerrado con confirmación" vs "cerrado sin confirmar".
export function EmailChangeConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  currentEmail,
  newEmail,
  confirmLabel,
  cancelLabel,
  onConfirm,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 p-4">
          {body && <p className="text-sm whitespace-pre-line">{body}</p>}
          <div className="bg-muted/50 space-y-1 rounded-md p-3 text-sm">
            {currentEmail && (
              <p>
                <span className="text-muted-foreground">De:</span>{' '}
                <span className="font-mono line-through">{currentEmail}</span>
              </p>
            )}
            <p>
              <span className="text-muted-foreground">A:</span>{' '}
              <span className="font-mono font-medium">{newEmail}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => onConfirm()}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
