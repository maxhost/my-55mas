'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { FormRenderer } from '@/shared/components/form-renderer';
import type { FormWithTranslations, FormField, FormTranslationData, ServiceSelectOption } from '@/shared/lib/forms/types';
import { submitTalentService } from '../actions/submit-talent-service';

type SubtypeOption = { id: string; slug: string; name: string; group_slug: string };

type Props = {
  talentId: string;
  serviceId: string;
  countryId: string;
  form: FormWithTranslations;
  locale: string;
  existingData: Record<string, unknown> | null;
  selectedSubtypeIds: string[];
  subtypeOptions: SubtypeOption[];
  serviceOptions?: ServiceSelectOption[];
};

export function TalentServiceRenderer({
  talentId,
  serviceId,
  countryId,
  form,
  locale,
  existingData,
  selectedSubtypeIds,
  subtypeOptions,
  serviceOptions,
}: Props) {
  const t = useTranslations('TalentPortal');
  const tc = useTranslations('Common');
  const [isPending, startTransition] = useTransition();
  const [subtypes, setSubtypes] = useState<string[]>(selectedSubtypeIds);

  const toggleSubtype = (id: string) => {
    setSubtypes((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = (formData: Record<string, unknown>) => {
    startTransition(async () => {
      const result = await submitTalentService({
        talent_id: talentId,
        service_id: serviceId,
        country_id: countryId,
        form_id: form.id,
        form_data: formData,
        form_schema: form.schema,
        subtype_ids: subtypes,
      });

      if (result && 'error' in result) {
        const errors = result.error as Record<string, string[] | undefined>;
        const firstMsg = Object.values(errors).flat().filter(Boolean)[0];
        toast.error(firstMsg ?? tc('saveError'));
        return;
      }

      toast.success(tc('savedSuccess'));
    });
  };

  const renderCustomField = (field: FormField, trans: FormTranslationData) => {
    if (field.type !== 'subtype') return null;

    const label = trans.labels[field.key] ?? field.key;
    const groupOptions = field.subtype_group
      ? subtypeOptions.filter((opt) => opt.group_slug === field.subtype_group)
      : subtypeOptions;

    return (
      <div key={field.key} className="space-y-2">
        <Label>{label}{field.required && ' *'}</Label>
        {groupOptions.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('noSubtypes')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {groupOptions.map((opt) => (
              <label key={opt.id} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={subtypes.includes(opt.id)}
                  onChange={() => toggleSubtype(opt.id)}
                  className="h-4 w-4"
                />
                {opt.name}
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <FormRenderer
      form={form}
      locale={locale}
      initialData={existingData ?? undefined}
      onSubmit={handleSubmit}
      submitLabel={isPending ? t('saving') : t('save')}
      isPending={isPending}
      selectPlaceholder={t('select')}
      renderCustomField={renderCustomField}
      serviceOptions={serviceOptions}
    />
  );
}
