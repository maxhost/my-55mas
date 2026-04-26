'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmailChangeConfirmDialog } from '../email-change-confirm-dialog';
import { labelText, type RenderProps } from './shared';

// Renderer especializado para input_type='email' + persistence_type='auth'.
//
// Dos modos según config.allow_change:
//
// - allow_change !== true → Input readOnly. El email viene pre-llenado
//   desde readAuth (sesión actual). El user no puede cambiarlo en el
//   formulario.
//
// - allow_change === true → Input editable con confirmación obligatoria.
//   El user tipea libremente en un buffer local (`typed`). Al blur, si
//   `typed` difiere del email committeado (`value`), se abre un modal que
//   muestra old→new + texto configurable per-locale (option_labels). Sólo
//   al confirmar se llama onChange(field.key, typed) — el valor
//   committeado recién entonces pasa al form state, que a su vez dispara
//   supabase.auth.updateUser en persist-form-data (vía writeAuth).
//
// Si el user cancela, cierra con ESC o con click fuera, typed se revierte
// al committed — no se llama onChange, no hay efecto lateral.
export function EmailAuthField({
  field,
  value,
  errorClass,
  onChange,
}: RenderProps) {
  const tc = useTranslations('Common');
  const committed = typeof value === 'string' ? value : '';
  const allowChange = Boolean(
    (field.config as { allow_change?: boolean } | null | undefined)
      ?.allow_change
  );
  const [typed, setTyped] = useState(committed);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Sincroniza el buffer local si el committed cambia por afuera
  // (ej: submit exitoso, hot-reload con nuevo value).
  useEffect(() => {
    setTyped(committed);
  }, [committed]);

  if (!allowChange) {
    return (
      <div key={field.key} className="space-y-1">
        <Label>{labelText(field)}</Label>
        <Input
          type="email"
          value={committed}
          readOnly
          className={`bg-muted/50 cursor-not-allowed ${errorClass}`}
        />
        {field.description && (
          <p className="text-muted-foreground text-xs">{field.description}</p>
        )}
      </div>
    );
  }

  const labels = field.option_labels ?? {};
  // Fallback a Common cuando el admin no seteó texto custom per-locale,
  // así el modal siempre renderiza un título accesible y un cuerpo útil.
  const modalTitle =
    (labels.modal_title && labels.modal_title.trim()) ||
    tc('emailChangeDefaultTitle');
  const modalBody =
    (labels.modal_body && labels.modal_body.trim()) ||
    tc('emailChangeDefaultBody');

  const handleBlur = () => {
    const next = typed.trim();
    if (!next) {
      setTyped(committed);
      return;
    }
    if (next !== committed) setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) setTyped(committed);
    setDialogOpen(open);
  };

  const handleConfirm = () => {
    onChange(field.key, typed.trim());
    setDialogOpen(false);
  };

  return (
    <div key={field.key} className="space-y-1">
      <Label>{labelText(field)}</Label>
      <Input
        type="email"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        onBlur={handleBlur}
        placeholder={field.placeholder}
        className={errorClass}
      />
      {field.description && (
        <p className="text-muted-foreground text-xs">{field.description}</p>
      )}
      <EmailChangeConfirmDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        title={modalTitle}
        body={modalBody}
        currentEmail={committed || null}
        newEmail={typed.trim()}
        confirmLabel={tc('confirm')}
        cancelLabel={tc('cancel')}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

export function renderEmailAuth(props: RenderProps) {
  return <EmailAuthField {...props} />;
}
