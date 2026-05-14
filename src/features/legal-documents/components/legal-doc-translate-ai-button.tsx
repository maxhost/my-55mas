'use client';

import { useState, useTransition } from 'react';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { translateLegalDocument } from '../actions/translate-legal-document';
import type {
  LegalDocumentSlug,
  LegalDocumentTranslation,
} from '../types';

type Props = {
  slug: LegalDocumentSlug;
  expectedUpdatedAt: string;
  esTranslation: LegalDocumentTranslation;
  /** Called BEFORE the action runs so the parent can flush any
   *  in-flight editor onChange and update its ES slot first. */
  onBeforeTranslate?: () => void;
  /** Called with the new updated_at after a successful translation so
   *  the parent can refresh its optimistic-lock state. */
  onSaved: (newUpdatedAt: string) => void;
};

export function LegalDocTranslateAiButton({
  slug,
  expectedUpdatedAt,
  esTranslation,
  onBeforeTranslate,
  onSaved,
}: Props) {
  const t = useTranslations('AdminLegalDocuments');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const enabled = Boolean(esTranslation.richHtml?.trim());

  const handleConfirm = () => {
    onBeforeTranslate?.();
    startTransition(async () => {
      const result = await translateLegalDocument({
        slug,
        expectedUpdatedAt,
        esTranslation,
      });
      if ('error' in result) {
        if (result.error === 'doc-too-large') {
          toast.error(t('aiTranslateErrorTooLarge'));
        } else if (result.error === 'optimistic-lock') {
          toast.error(t('optimisticLockError'));
        } else if (result.error === 'es-empty') {
          toast.error(t('aiTranslateDisabledHint'));
        } else {
          toast.error(t('aiTranslateError'));
        }
        return;
      }
      onSaved(result.data.updated_at);
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
