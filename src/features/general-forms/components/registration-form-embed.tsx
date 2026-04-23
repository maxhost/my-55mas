'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { FormRenderer, type SubmitMeta } from '@/shared/components/form-renderer';
import type { ResolvedForm } from '@/shared/lib/field-catalog/resolved-types';
import { registerUser } from '../actions/register-user';
import { saveRegistrationStep } from '../actions/save-registration-step';

type Props = {
  resolvedForm: ResolvedForm;
  targetRole: 'talent' | 'client';
  submitLabel?: string;
  countryId?: string;
  cityId?: string;
  onSubmit?: (formData: Record<string, unknown>) => Promise<void> | void;
};

// El form es un signup wizard si tiene algún field con persistence_type='auth'
// (el user no existe hasta que se dispare el 'register' del último step).
function formHasAuthFields(form: ResolvedForm): boolean {
  for (const step of form.steps) {
    for (const field of step.fields) {
      if (field.persistence_type === 'auth') return true;
    }
  }
  return false;
}

export function RegistrationFormEmbed({
  resolvedForm,
  targetRole,
  submitLabel,
  countryId,
  cityId,
  onSubmit,
}: Props) {
  const tc = useTranslations('Common');
  const currentLocale = useLocale();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignupForm = formHasAuthFields(resolvedForm);

  const handleRedirect = (redirectUrl?: string) => {
    if (redirectUrl) router.push(`/${currentLocale}${redirectUrl}`);
  };

  const handleSubmit = async (
    formData: Record<string, unknown>,
    meta?: SubmitMeta
  ): Promise<boolean> => {
    setError(null);
    setIsPending(true);
    try {
      // Signup wizard: el user no existe aún. Normalizamos:
      // - 'submit' o 'register' en step intermedio → avanzar sin tocar server.
      // - 'submit' o 'register' en último step → registerUser (crear auth user).
      const shouldRegister =
        isSignupForm && meta?.isLastStep
          ? true
          : meta?.action === 'register';
      const shouldAdvanceOnly =
        isSignupForm && !meta?.isLastStep;

      if (shouldAdvanceOnly) {
        // Ni save ni register — solo avanzar. Data queda en FormRenderer state.
        return true;
      }

      if (shouldRegister) {
        const result = await registerUser({
          form_data: formData,
          resolved_form: resolvedForm,
          locale: currentLocale,
          target_role: targetRole,
          country_id: countryId,
          city_id: cityId,
        });
        if ('error' in result && result.error) {
          const msg = flattenError(result.error);
          setError(msg);
          toast.error(msg);
          return false;
        }
        toast.success(tc('savedSuccess'));
        if (meta?.isLastStep) handleRedirect(meta.redirect_url);
        return true;
      }

      const stepResult = await saveRegistrationStep({
        form_data: formData,
        resolved_form: resolvedForm,
        target_role: targetRole,
      });
      if ('error' in stepResult && stepResult.error) {
        const msg = flattenError(stepResult.error);
        setError(msg);
        toast.error(msg);
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
        form={resolvedForm}
        onSubmit={handleSubmit}
        submitLabel={submitLabel ?? (isPending ? tc('saving') : tc('save'))}
        isPending={isPending}
      />
    </div>
  );
}

function flattenError(error: Record<string, string[] | undefined>): string {
  const msg = Object.values(error).flat().filter(Boolean)[0];
  return msg ?? 'Error';
}
