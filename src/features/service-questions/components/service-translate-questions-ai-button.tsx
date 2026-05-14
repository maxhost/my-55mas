'use client';

import { useState, useTransition } from 'react';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import type {
  Question,
  QuestionTarget,
} from '@/shared/lib/questions/types';
import { translateServiceQuestions } from '../actions/translate-service-questions';

type Props = {
  serviceId: string;
  target: QuestionTarget;
  /** Live state of questions from the editor — passed to the action so
   *  the ES side is auto-saved alongside the 4 translations. */
  questions: Question[];
};

function hasEsLabel(q: Question): boolean {
  return Boolean(q.i18n?.es?.label?.trim());
}

export function ServiceTranslateQuestionsAiButton({
  serviceId,
  target,
  questions,
}: Props) {
  const t = useTranslations('AdminServiceQuestions');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const enabled = questions.some(hasEsLabel);

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await translateServiceQuestions({
        service_id: serviceId,
        target,
        questions,
      });
      if ('error' in result) {
        if (result.error === 'too-many-questions') {
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
