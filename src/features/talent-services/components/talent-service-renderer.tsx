'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { FormRenderer } from '@/shared/components/form-renderer';
import type { ResolvedForm } from '@/shared/lib/field-catalog/resolved-types';
import { submitTalentService } from '../actions/submit-talent-service';

type Props = {
  talentId: string;
  serviceId: string;
  countryId: string;
  formId: string;
  resolvedForm: ResolvedForm;
};

export function TalentServiceRenderer({
  talentId,
  serviceId,
  countryId,
  formId,
  resolvedForm,
}: Props) {
  const t = useTranslations('TalentPortal');
  const tc = useTranslations('Common');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: Record<string, unknown>) => {
    startTransition(async () => {
      const result = await submitTalentService({
        talent_id: talentId,
        service_id: serviceId,
        country_id: countryId,
        form_id: formId,
        form_data: formData,
        resolved_form: resolvedForm,
      });
      if (result && 'error' in result && result.error) {
        const firstMsg = Object.values(result.error).flat().filter(Boolean)[0];
        toast.error(firstMsg ?? tc('saveError'));
        return;
      }
      toast.success(tc('savedSuccess'));
    });
  };

  return (
    <FormRenderer
      form={resolvedForm}
      onSubmit={handleSubmit}
      submitLabel={isPending ? t('saving') : t('save')}
      isPending={isPending}
      selectPlaceholder={t('select')}
    />
  );
}
