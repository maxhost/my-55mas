'use client';

import { useState, useTransition } from 'react';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { translateReviews } from '../actions/translate-reviews';
import type { ReviewInput } from '../types';

type Props = {
  /** Live state of reviews from the editor — passed to the action so
   *  the ES side is auto-saved alongside the 4 translations. */
  reviews: ReviewInput[];
};

function hasEsText(r: ReviewInput): boolean {
  return Boolean(r.id && r.translations.es?.trim());
}

export function ReviewsTranslateAiButton({ reviews }: Props) {
  const t = useTranslations('AdminReviews');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const enabled = reviews.some(hasEsText);

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await translateReviews({ reviews });
      if ('error' in result) {
        if (result.error === 'too-many-reviews') {
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
