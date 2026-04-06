'use client';

import { type ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import type {
  FormSchema,
  FormField,
  FormTranslationData,
  StepAction,
  SurveyQuestionRenderData,
} from '@/shared/lib/forms/types';
import {
  renderBoolean,
  renderMultilineText,
  renderSingleSelect,
  renderMultiselect,
  renderSurveyField,
  renderDbColumn,
  renderDefaultInput,
} from './field-renderers';

// ── Types ────────────────────────────────────────────

export type SubmitMeta = {
  action: 'save' | 'register';
  redirect_url?: string;
};

type FormLike = {
  schema: FormSchema;
  translations: Record<string, FormTranslationData>;
};

type Props = {
  form: FormLike;
  locale: string;
  initialData?: Record<string, unknown>;
  onSubmit: (formData: Record<string, unknown>, meta?: SubmitMeta) => void;
  submitLabel?: string;
  isPending?: boolean;
  selectPlaceholder?: string;
  surveyQuestions?: Record<string, SurveyQuestionRenderData>;
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
  surveyQuestions,
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

    const meta: SubmitMeta = {
      action: action.type === 'register' ? 'register' : 'save',
      redirect_url: action.redirect_url,
    };
    onSubmit(data, meta);
  };

  const renderField = (field: FormField) => {
    if (renderCustomField) {
      const custom = renderCustomField(field, trans);
      if (custom !== null) return custom;
    }

    const label = trans.labels[field.key] ?? field.key;
    const placeholder = trans.placeholders[field.key] ?? '';
    const hasError = errors.has(field.key);
    const errorClass = hasError ? 'border-destructive' : '';
    const base = { field, value: data[field.key], label, placeholder, errorClass, isRequired: field.required, onChange: setValue };
    const selectBase = { ...base, optionLabels: trans.option_labels, selectPlaceholder };

    if (field.type === 'boolean') return renderBoolean(base);
    if (field.type === 'multiline_text') return renderMultilineText(base);
    if (field.type === 'single_select') return renderSingleSelect(selectBase);
    if (field.type === 'multiselect') return renderMultiselect(selectBase);
    if (field.type === 'survey' && field.survey_question_key) {
      return renderSurveyField({ ...base, surveyQuestions });
    }
    if (field.type === 'db_column') {
      return renderDbColumn(selectBase);
    }
    return renderDefaultInput(base);
  };

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

  return (
    <div className="space-y-6">
      {steps.map(renderStep)}
      <Button onClick={() => onSubmit(data)} disabled={isPending}>
        {submitLabel ?? 'Submit'}
      </Button>
    </div>
  );
}
