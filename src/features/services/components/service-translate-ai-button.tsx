'use client';

import { useState, useTransition } from 'react';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { translateService } from '../actions/translate-service';
import type { ServiceTranslationDetail } from '../types';

type Props = {
  serviceId: string;
  /** Snapshot vivo del ES desde el form. El action lo guarda en DB tal
   *  cual lo recibe (auto-save), junto con las 4 traducciones. */
  esTranslation: ServiceTranslationDetail;
};

// Enable the AI button only when ES has the bare minimum context: a name
// AND at least one descriptive field. Avoids the degenerate case where
// only the name is translated and the other 7 fields wipe existing
// manual translations in EN/PT/FR/CA.
function canTranslate(es: ServiceTranslationDetail): boolean {
  if (!es.name?.trim()) return false;
  return Boolean(
    (es.description && es.description.trim()) ||
      (es.includes && es.includes.trim()) ||
      (es.hero_title && es.hero_title.trim()),
  );
}

export function ServiceTranslateAiButton({ serviceId, esTranslation }: Props) {
  const t = useTranslations('AdminServices');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const enabled = canTranslate(esTranslation);

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await translateService({
        service_id: serviceId,
        esTranslation,
      });
      if ('error' in result) {
        toast.error(t('aiTranslateError'));
        return;
      }
      toast.success(t('aiTranslateSuccess'));
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!enabled || isPending}
        onClick={() => setOpen(true)}
        title={!enabled ? t('aiTranslateDisabledHint') : undefined}
        className="gap-1.5"
      >
        <Sparkles className="size-4" />
        {isPending ? t('aiTranslating') : t('aiTranslateButtonLabel')}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={(o) => {
          if (!isPending) setOpen(o);
        }}
        title={t('aiTranslateConfirmTitle')}
        description={t('aiTranslateConfirmDescription')}
        confirmLabel={t('aiTranslate')}
        cancelLabel={tc('cancel')}
        onConfirm={handleConfirm}
        isPending={isPending}
      />
    </>
  );
}
