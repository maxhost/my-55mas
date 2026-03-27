'use client';

import { type ReactNode, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { FormWithTranslations, FormField, FormTranslationData } from '@/shared/lib/forms/types';

type Props = {
  form: FormWithTranslations;
  locale: string;
  initialData?: Record<string, unknown>;
  onSubmit: (formData: Record<string, unknown>) => void;
  submitLabel: string;
  isPending?: boolean;
  selectPlaceholder?: string;
  renderCustomField?: (
    field: FormField,
    trans: FormTranslationData,
  ) => ReactNode | null;
};

export function FormRenderer({
  form,
  locale,
  initialData,
  onSubmit,
  submitLabel,
  isPending = false,
  selectPlaceholder = '',
  renderCustomField,
}: Props) {
  const [data, setData] = useState<Record<string, unknown>>(initialData ?? {});

  const trans = form.translations[locale] ?? { labels: {}, placeholders: {}, option_labels: {} };

  const setValue = (key: string, value: unknown) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const renderField = (field: FormField) => {
    // Delegate feature-specific field types to the wrapper
    if (renderCustomField) {
      const custom = renderCustomField(field, trans);
      if (custom !== null) return custom;
    }

    const label = trans.labels[field.key] ?? field.key;
    const placeholder = trans.placeholders[field.key] ?? '';

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
            <option value="">{placeholder || selectPlaceholder}</option>
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

    // text, number, file (fallback)
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

      <Button onClick={() => onSubmit(data)} disabled={isPending}>
        {submitLabel}
      </Button>
    </div>
  );
}
