'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { FormRenderer, type SubmitMeta } from '@/shared/components/form-renderer';
import type { SurveyQuestionRenderData, ServiceSelectOption } from '@/shared/lib/forms/types';
import type { RegistrationFormWithTranslations } from '../types';
import { registerUser } from '../actions/register-user';
import { saveRegistrationStep } from '../actions/save-registration-step';

type Props = {
  form: RegistrationFormWithTranslations;
  locale: string;
  initialData?: Record<string, unknown>;
  onSubmit?: (formData: Record<string, unknown>) => Promise<void> | void;
  submitLabel?: string;
  surveyQuestions?: Record<string, SurveyQuestionRenderData>;
  serviceOptions?: ServiceSelectOption[];
  countryId?: string;
  cityId?: string;
};

export function RegistrationFormEmbed({
  form,
  locale,
  initialData,
  onSubmit,
  submitLabel,
  surveyQuestions,
  serviceOptions,
  countryId,
  cityId,
}: Props) {
  const tc = useTranslations('Common');
  const currentLocale = useLocale();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRedirect = (redirectUrl?: string) => {
    if (redirectUrl) {
      router.push(`/${currentLocale}${redirectUrl}`);
    }
  };

  const handleSubmit = async (
    formData: Record<string, unknown>,
    meta?: SubmitMeta,
  ): Promise<boolean> => {
    setError(null);
    setIsPending(true);
    try {
      if (meta?.action === 'register') {
        const result = await registerUser({
          form_data: formData,
          form_schema: form.schema,
          locale: currentLocale,
          target_role: form.target_role,
          country_id: countryId,
          city_id: cityId,
        });

        if ('error' in result && result.error) {
          const errObj = result.error as Record<string, string[] | undefined>;
          const msg = Object.values(errObj).flat().filter(Boolean)[0];
          setError(msg ?? tc('saveError'));
          toast.error(msg ?? tc('saveError'));
          return false;
        }

        toast.success(tc('savedSuccess'));
        if (meta.isLastStep) handleRedirect(meta.redirect_url);
        return true;
      }

      // Default: save action — persist to DB, then optional callback
      const stepResult = await saveRegistrationStep({
        form_data: formData,
        form_schema: form.schema,
        target_role: form.target_role,
      });

      if ('error' in stepResult && stepResult.error) {
        const errObj = stepResult.error as Record<string, string[] | undefined>;
        const msg = Object.values(errObj).flat().filter(Boolean)[0];
        setError(msg ?? tc('saveError'));
        toast.error(msg ?? tc('saveError'));
        return false;
      }

      if (onSubmit) await onSubmit(formData);
      toast.success(tc('savedSuccess'));
      if (meta?.isLastStep) handleRedirect(meta?.redirect_url);
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : tc('saveError');
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setIsPending(false);
    }
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
        serviceOptions={serviceOptions}
      />
    </div>
  );
}
