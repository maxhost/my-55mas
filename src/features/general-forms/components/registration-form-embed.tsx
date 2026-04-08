'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { FormRenderer, type SubmitMeta } from '@/shared/components/form-renderer';
import type { SurveyQuestionRenderData } from '@/shared/lib/forms/types';
import type { RegistrationFormWithTranslations } from '../types';
import { registerUser } from '../actions/register-user';

type Props = {
  form: RegistrationFormWithTranslations;
  locale: string;
  initialData?: Record<string, unknown>;
  onSubmit?: (formData: Record<string, unknown>) => Promise<void> | void;
  submitLabel?: string;
  surveyQuestions?: Record<string, SurveyQuestionRenderData>;
};

export function RegistrationFormEmbed({
  form,
  locale,
  initialData,
  onSubmit,
  submitLabel,
  surveyQuestions,
}: Props) {
  const tc = useTranslations('Common');
  const currentLocale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleRedirect = (redirectUrl?: string) => {
    if (redirectUrl) {
      router.push(`/${currentLocale}${redirectUrl}`);
    }
  };

  const handleSubmit = (formData: Record<string, unknown>, meta?: SubmitMeta) => {
    setError(null);
    startTransition(async () => {
      try {
        if (meta?.action === 'register') {
          const result = await registerUser({
            form_data: formData,
            form_schema: form.schema,
            locale: currentLocale,
            target_role: form.target_role,
          });

          if ('error' in result && result.error) {
            const errObj = result.error as Record<string, string[] | undefined>;
            const msg = Object.values(errObj).flat().filter(Boolean)[0];
            setError(msg ?? tc('saveError'));
            toast.error(msg ?? tc('saveError'));
            return;
          }

          toast.success(tc('savedSuccess'));
          handleRedirect(meta.redirect_url);
          return;
        }

        // Default: save action — delegate to page's onSubmit
        if (onSubmit) {
          await onSubmit(formData);
        }
        toast.success(tc('savedSuccess'));
        handleRedirect(meta?.redirect_url);
      } catch (e) {
        const msg = e instanceof Error ? e.message : tc('saveError');
        setError(msg);
        toast.error(msg);
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <FormRenderer
        form={form}
        locale={locale}
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel={submitLabel ?? (isPending ? tc('saving') : tc('save'))}
        isPending={isPending}
        surveyQuestions={surveyQuestions}
      />
    </div>
  );
}
