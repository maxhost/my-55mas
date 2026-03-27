'use client';

import { type ReactNode, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type {
  FormWithTranslations,
  FormField,
  FormTranslationData,
  StepAction,
} from '@/shared/lib/forms/types';

// ── Types ────────────────────────────────────────────

export type SubmitMeta = {
  action: 'save' | 'register';
  redirect_url?: string;
};

type Props = {
  form: FormWithTranslations;
  locale: string;
  initialData?: Record<string, unknown>;
  onSubmit: (formData: Record<string, unknown>, meta?: SubmitMeta) => void;
  submitLabel?: string;
  isPending?: boolean;
  selectPlaceholder?: string;
  renderCustomField?: (
    field: FormField,
    trans: FormTranslationData,
  ) => ReactNode | null;
};

// ── Component ────────────────────────────────────────

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
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Set<string>>(new Set());

  const { steps } = form.schema;
  const trans = form.translations[locale] ?? { labels: {}, placeholders: {}, option_labels: {} };
  const isWizard = steps.some((s) => s.actions && s.actions.length > 0);

  const setValue = (key: string, value: unknown) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  // ── Validation ───────────────────────────────────

  const validateStep = (step: (typeof steps)[number]): boolean => {
    const missing = new Set<string>();
    for (const field of step.fields) {
      if (!field.required) continue;
      const val = data[field.key];
      if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
        missing.add(field.key);
      }
    }
    setErrors(missing);
    return missing.size === 0;
  };

  // ── Action handlers ──────────────────────────────

  const handleAction = (action: StepAction) => {
    if (action.type === 'back') {
      setStepIndex((i) => Math.max(0, i - 1));
      setErrors(new Set());
      return;
    }

    const currentStep = steps[stepIndex];
    if (!validateStep(currentStep)) return;

    if (action.type === 'next') {
      setStepIndex((i) => Math.min(steps.length - 1, i + 1));
      return;
    }

    // submit or register
    const meta: SubmitMeta = {
      action: action.type === 'register' ? 'register' : 'save',
      redirect_url: action.redirect_url,
    };
    onSubmit(data, meta);
  };

  // ── Field rendering ──────────────────────────────

  const renderField = (field: FormField) => {
    if (renderCustomField) {
      const custom = renderCustomField(field, trans);
      if (custom !== null) return custom;
    }

    const label = trans.labels[field.key] ?? field.key;
    const placeholder = trans.placeholders[field.key] ?? '';
    const hasError = errors.has(field.key);
    const errorClass = hasError ? 'border-destructive' : '';

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
            className={errorClass}
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
            className={`border-border bg-background h-9 w-full rounded-md border px-3 text-sm ${errorClass}`}
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

    // text, number, email, password, file (fallback)
    const inputType =
      field.type === 'number' ? 'number'
        : field.type === 'email' ? 'email'
          : field.type === 'password' ? 'password'
            : 'text';

    return (
      <div key={field.key} className="space-y-1">
        <Label>{label}{field.required && ' *'}</Label>
        <Input
          type={inputType}
          value={(data[field.key] as string) ?? ''}
          onChange={(e) => setValue(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
          className={errorClass}
        />
      </div>
    );
  };

  // ── Step rendering ───────────────────────────────

  const renderStep = (step: (typeof steps)[number]) => (
    <div key={step.key} className="space-y-4">
      <h3 className="text-lg font-medium">
        {trans.labels[step.key] ?? step.key}
      </h3>
      {step.fields.map(renderField)}
    </div>
  );

  const renderActions = (actions: StepAction[]) => (
    <div className="flex justify-end gap-2">
      {actions.map((action) => {
        const label = trans.labels[action.key] ?? action.key;
        const isBack = action.type === 'back';
        return (
          <Button
            key={action.key}
            variant={isBack ? 'ghost' : 'default'}
            onClick={() => handleAction(action)}
            disabled={isPending && !isBack}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );

  // ── Wizard mode ──────────────────────────────────

  if (isWizard) {
    const currentStep = steps[stepIndex];
    const actions = currentStep.actions ?? (
      stepIndex < steps.length - 1
        ? [{ key: 'btn_next', type: 'next' as const }]
        : [{ key: 'btn_submit', type: 'submit' as const }]
    );

    return (
      <div className="space-y-6">
        <p className="text-muted-foreground text-sm">
          {stepIndex + 1} / {steps.length}
        </p>
        {renderStep(currentStep)}
        {renderActions(actions)}
      </div>
    );
  }

  // ── Legacy mode (all steps + single submit) ──────

  return (
    <div className="space-y-6">
      {steps.map(renderStep)}
      <Button onClick={() => onSubmit(data)} disabled={isPending}>
        {submitLabel ?? 'Submit'}
      </Button>
    </div>
  );
}
