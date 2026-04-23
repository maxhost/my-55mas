'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type {
  ResolvedAction,
  ResolvedForm,
  ResolvedField,
  ResolvedStep,
} from '@/shared/lib/field-catalog/resolved-types';
import { renderResolvedField } from './field-renderers';

// ── Types ────────────────────────────────────────────

export type SubmitMeta = {
  action: 'save' | 'register';
  redirect_url?: string;
  isLastStep: boolean;
};

type Props = {
  form: ResolvedForm;
  onSubmit: (
    formData: Record<string, unknown>,
    meta?: SubmitMeta
  ) => void | Promise<boolean>;
  submitLabel?: string;
  isPending?: boolean;
  selectPlaceholder?: string;
};

function buildInitialData(form: ResolvedForm): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const step of form.steps) {
    for (const field of step.fields) {
      if (field.current_value !== undefined) {
        data[field.key] = field.current_value;
      }
    }
  }
  return data;
}

function isRequiredEmpty(field: ResolvedField, value: unknown): boolean {
  if (!field.required) return false;
  // Fields presentacionales (display_text, persistence='none') no capturan
  // valor — required en ellos es un no-op. Coherente con validateRequired
  // del server (persist-form-data).
  if (field.persistence_type === 'none') return false;
  // terms_checkbox: "no aceptado" (undefined, false) bloquea. Solo true vale.
  if (field.input_type === 'terms_checkbox') return value !== true;
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

// ── Component ────────────────────────────────────────

export function FormRenderer({
  form,
  onSubmit,
  submitLabel,
  isPending = false,
  selectPlaceholder = '',
}: Props) {
  const [data, setData] = useState<Record<string, unknown>>(() =>
    buildInitialData(form)
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Set<string>>(new Set());

  const { steps } = form;
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

  const validateStep = (step: ResolvedStep): boolean => {
    const missing = new Set<string>();
    for (const field of step.fields) {
      if (isRequiredEmpty(field, data[field.key])) missing.add(field.key);
    }
    setErrors(missing);
    return missing.size === 0;
  };

  const handleAction = async (action: ResolvedAction) => {
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
    const isLastStep = stepIndex >= steps.length - 1;
    const meta: SubmitMeta = {
      action: action.type === 'register' ? 'register' : 'save',
      redirect_url: action.redirect_url,
      isLastStep,
    };
    const result = await onSubmit(data, meta);
    if (result === true && !isLastStep) {
      setStepIndex((i) => Math.min(steps.length - 1, i + 1));
    }
  };

  const renderStep = (step: ResolvedStep) => (
    <div key={step.key} className="space-y-4">
      <h3 className="text-lg font-medium">{step.label}</h3>
      {step.fields.map((field) =>
        renderResolvedField(
          field,
          data[field.key],
          errors.has(field.key) ? 'border-destructive' : '',
          setValue,
          selectPlaceholder
        )
      )}
    </div>
  );

  const renderActions = (actions: ResolvedAction[]) => (
    <div className="flex justify-end gap-2">
      {actions.map((action) => {
        const isBack = action.type === 'back';
        return (
          <Button
            key={action.key}
            variant={isBack ? 'ghost' : 'default'}
            onClick={() => handleAction(action)}
            disabled={isPending && !isBack}
          >
            {action.label}
          </Button>
        );
      })}
    </div>
  );

  if (isWizard) {
    const currentStep = steps[stepIndex];
    const actions: ResolvedAction[] =
      currentStep.actions ??
      (stepIndex < steps.length - 1
        ? [{ key: 'btn_next', type: 'next', label: 'Next' }]
        : [{ key: 'btn_submit', type: 'submit', label: 'Submit' }]);

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

  return (
    <div className="space-y-6">
      {steps.map(renderStep)}
      <Button
        onClick={() => {
          const missing = new Set<string>();
          for (const step of steps) {
            for (const field of step.fields) {
              if (isRequiredEmpty(field, data[field.key])) missing.add(field.key);
            }
          }
          if (missing.size > 0) {
            setErrors(missing);
            return;
          }
          void onSubmit(data);
        }}
        disabled={isPending}
      >
        {submitLabel ?? 'Submit'}
      </Button>
    </div>
  );
}
