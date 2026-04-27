'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  FormRenderer,
  type SubmitMeta,
  type FieldSlots,
  type ActionGuard,
} from '@/shared/components/form-renderer';
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
  // Slots y guards opcionales — passthrough al FormRenderer.
  fieldSlots?: FieldSlots;
  actionGuards?: Record<string, ActionGuard>;
};

// Client renderer del embed: maneja submit dispatch (register vs save),
// redirect post-submit, errors. Lo invoca el Server wrapper
// `RegistrationFormEmbed` (registration-form-embed.tsx). Embedders nunca
// importan este componente directamente — siempre usan el Server wrapper.
export function RegistrationFormEmbedRenderer({
  resolvedForm,
  targetRole,
  submitLabel,
  countryId,
  cityId,
  onSubmit,
  fieldSlots,
  actionGuards,
}: Props) {
  const tc = useTranslations('Common');
  const currentLocale = useLocale();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRedirect = (redirectUrl?: string) => {
    if (redirectUrl) router.push(`/${currentLocale}${redirectUrl}`);
  };

  // Dispatch action-driven. next/back los maneja FormRenderer sin llegar acá.
  // register → registerUser (crea auth user + perfil + persiste el resto).
  // submit  → saveRegistrationStep (upsert sobre user autenticado; para auth
  //           fields, writeAuth en edit flow es no-op si el email no cambió,
  //           o dispara updateUser si allow_change=true y el user lo cambió).
  const handleSubmit = async (
    formData: Record<string, unknown>,
    meta?: SubmitMeta
  ): Promise<boolean> => {
    setError(null);
    setIsPending(true);
    try {
      if (meta?.action === 'register') {
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
        fieldSlots={fieldSlots}
        actionGuards={actionGuards}
      />
    </div>
  );
}

function flattenError(error: Record<string, string[] | undefined>): string {
  const msg = Object.values(error).flat().filter(Boolean)[0];
  return msg ?? 'Error';
}
