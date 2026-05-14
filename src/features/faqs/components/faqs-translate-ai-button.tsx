'use client';

import { useState, useTransition } from 'react';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { translateFaqs } from '../actions/translate-faqs';
import type { FaqInput } from '../types';

type Props = {
  faqs: FaqInput[];
};

function hasEsContent(f: FaqInput): boolean {
  return Boolean(
    f.id &&
      f.translations.es?.question?.trim() &&
      f.translations.es?.answer?.trim(),
  );
}

export function FaqsTranslateAiButton({ faqs }: Props) {
  const t = useTranslations('AdminFaqs');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const enabled = faqs.some(hasEsContent);

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await translateFaqs({ faqs });
      if ('error' in result) {
        if (result.error === 'too-many-faqs') {
          toast.error(t('aiTranslateErrorTooMany'));
        } else {
          toast.error(t('aiTranslateError'));
        }
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
