'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { FormRenderer, type SubmitMeta } from '@/shared/components/form-renderer';
import type { ResolvedForm } from '@/shared/lib/field-catalog/resolved-types';
import { devWarn } from '@/shared/lib/embed/dev-warn';
import { submitTalentService } from '../actions/submit-talent-service';

type Props = {
  serviceId: string;
  formId: string;
  resolvedForm: ResolvedForm;
  onSubmit?: (formData: Record<string, unknown>) => void | Promise<void>;
};

// Client renderer del embed de talent service. Lo invoca el Server
// wrapper `TalentServiceFormEmbed` (talent-service-form-embed.tsx).
// Embedders nunca importan este componente directamente.
//
// Action dispatch:
// - 'save' (default) → submitTalentService.
// - 'register' → no aplica en talent forms; downgrade a save + dev-warn.
// - 'next'/'back' los maneja FormRenderer sin llegar acá.
export function TalentServiceFormEmbedRenderer({
  serviceId,
  formId,
  resolvedForm,
  onSubmit,
}: Props) {
  const tc = useTranslations('Common');
  const tEmbed = useTranslations('TalentServiceEmbed');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    formData: Record<string, unknown>,
    meta?: SubmitMeta
  ): Promise<boolean> => {
    setError(null);
    setIsPending(true);

    if (meta?.action === 'register') {
      devWarn('TalentServiceFormEmbed', {
        warning: 'register-action-downgraded-to-save',
        formId,
      });
    }

    try {
      const result = await submitTalentService({
        service_id: serviceId,
        form_id: formId,
        form_data: formData,
        resolved_form: resolvedForm,
      });

      if ('error' in result && result.error) {
        const msg = mapError(result.error, tEmbed, tc);
        setError(msg);
        toast.error(msg);
        return false;
      }

      if (onSubmit) await onSubmit(formData);
      toast.success(tc('savedSuccess'));
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
        submitLabel={isPending ? tc('saving') : tc('save')}
        isPending={isPending}
      />
    </div>
  );
}

// Mapea el error del server action a un mensaje i18n. El primer error
// tipado gana: _auth > _config > _db > saveError fallback.
function mapError(
  error: Record<string, string[] | undefined>,
  tEmbed: ReturnType<typeof useTranslations>,
  tc: ReturnType<typeof useTranslations>
): string {
  if (error._auth?.length) return tEmbed('error.auth');
  if (error._config?.length) return tEmbed('error.config');
  if (error._db?.length) return tEmbed('error.db');
  return tc('saveError');
}
