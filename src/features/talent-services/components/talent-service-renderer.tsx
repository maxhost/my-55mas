'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { FormWithTranslations, FormField } from '@/shared/lib/forms/types';
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
}: Props) {
  const t = useTranslations('TalentPortal');
  const tc = useTranslations('Common');
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<Record<string, unknown>>(existingData ?? {});
  const [subtypes, setSubtypes] = useState<string[]>(selectedSubtypeIds);

  const trans = form.translations[locale] ?? { labels: {}, placeholders: {}, option_labels: {} };

  const setValue = (key: string, value: unknown) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSubtype = (id: string) => {
    setSubtypes((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await submitTalentService({
        talent_id: talentId,
        service_id: serviceId,
        country_id: countryId,
        form_id: form.id,
        form_data: data,
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

  const renderField = (field: FormField) => {
    const label = trans.labels[field.key] ?? field.key;
    const placeholder = trans.placeholders[field.key] ?? '';

    if (field.type === 'subtype') {
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
    }

    if (field.type === 'boolean') {
      return (
        <div key={field.key} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!data[field.key]}
            onChange={(e) => setValue(field.key, e.target.checked)}
            className="h-4 w-4"
          />
          <Label>{label}{field.required && ' *'}</Label>
        </div>
      );
    }

    if (field.type === 'multiline_text') {
      return (
        <div key={field.key} className="space-y-1">
          <Label>{label}{field.required && ' *'}</Label>
          <Textarea
            value={(data[field.key] as string) ?? ''}
            onChange={(e) => setValue(field.key, e.target.value)}
            placeholder={placeholder}
            rows={3}
          />
        </div>
      );
    }

    if (field.type === 'single_select') {
      return (
        <div key={field.key} className="space-y-1">
          <Label>{label}{field.required && ' *'}</Label>
          <select
            value={(data[field.key] as string) ?? ''}
            onChange={(e) => setValue(field.key, e.target.value)}
            className="border-border bg-background h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="">{placeholder || t('select')}</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {trans.option_labels[`${field.key}.${opt}`] ?? opt}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'multiselect') {
      const selected = (data[field.key] as string[]) ?? [];
      return (
        <div key={field.key} className="space-y-1">
          <Label>{label}{field.required && ' *'}</Label>
          <div className="flex flex-wrap gap-2">
            {(field.options ?? []).map((opt) => {
              const optLabel = trans.option_labels[`${field.key}.${opt}`] ?? opt;
              return (
                <label key={opt} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(opt)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...selected, opt]
                        : selected.filter((s) => s !== opt);
                      setValue(field.key, next);
                    }}
                    className="h-4 w-4"
                  />
                  {optLabel}
                </label>
              );
            })}
          </div>
        </div>
      );
    }

    // text, number, file
    return (
      <div key={field.key} className="space-y-1">
        <Label>{label}{field.required && ' *'}</Label>
        <Input
          type={field.type === 'number' ? 'number' : 'text'}
          value={(data[field.key] as string) ?? ''}
          onChange={(e) => setValue(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {form.schema.steps.map((step) => (
        <div key={step.key} className="space-y-4">
          <h3 className="text-lg font-medium">
            {trans.labels[step.key] ?? step.key}
          </h3>
          {step.fields.map(renderField)}
        </div>
      ))}

      <Button onClick={handleSubmit} disabled={isPending}>
        {isPending ? t('saving') : t('save')}
      </Button>
    </div>
  );
}
