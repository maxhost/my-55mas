'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { locales } from '@/lib/i18n/config';
import type {
  FormSchema,
  FormStep,
  FormTranslationData,
  FormWithTranslations,
  SaveFormResult,
} from '@/shared/lib/forms/types';
import type { SaveFormWithTranslationsInput } from '@/shared/lib/forms/schemas';
import { sanitizeTranslations } from '@/shared/lib/forms/sanitize-translations';
import { StepCard } from './step-card';
import type { SubtypeGroupOption } from './subtype-field-config';
import type { SurveyQuestionOption } from './survey-field-config';

type Props = {
  serviceId: string;
  cityId: string | null;
  form: FormWithTranslations | null;
  activeLocale: string;
  subtypeGroups: SubtypeGroupOption[];
  surveyQuestions: SurveyQuestionOption[];
  allowedTables?: string[];
  onSaved?: (form: FormWithTranslations) => void;
  // Callbacks — injected by feature wrapper
  onSave: (input: SaveFormWithTranslationsInput) => Promise<SaveFormResult>;
  onGetForm: (serviceId: string, cityId: string | null) => Promise<FormWithTranslations | null>;
};

function swap<T>(arr: T[], i: number, j: number): T[] {
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

function emptyTranslation(): FormTranslationData {
  return { labels: {}, placeholders: {}, option_labels: {} };
}

function initTranslations(
  form: FormWithTranslations | null
): Record<string, FormTranslationData> {
  const init: Record<string, FormTranslationData> = {};
  for (const locale of locales) {
    init[locale] = form?.translations[locale] ?? emptyTranslation();
  }
  return form ? sanitizeTranslations(form.schema, init) : init;
}

export function FormBuilder({
  serviceId, cityId, form, activeLocale, subtypeGroups, surveyQuestions, allowedTables, onSaved, onSave, onGetForm,
}: Props) {
  const t = useTranslations('AdminFormBuilder');
  const tc = useTranslations('Common');
  const [isPending, startTransition] = useTransition();
  const [schema, setSchema] = useState<FormSchema>(form?.schema ?? { steps: [] });
  const [translations, setTranslations] = useState(() => initTranslations(form));

  const current = translations[activeLocale] ?? emptyTranslation();

  const setLabel = (key: string, value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [activeLocale]: {
        ...prev[activeLocale],
        labels: { ...prev[activeLocale].labels, [key]: value },
      },
    }));
  };

  const setPlaceholder = (key: string, value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [activeLocale]: {
        ...prev[activeLocale],
        placeholders: { ...prev[activeLocale].placeholders, [key]: value },
      },
    }));
  };

  const setOptionLabel = (compositeKey: string, value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [activeLocale]: {
        ...prev[activeLocale],
        option_labels: {
          ...prev[activeLocale].option_labels,
          [compositeKey]: value,
        },
      },
    }));
  };

  const setSchemaClean = (newSchema: FormSchema) => {
    setSchema(newSchema);
    setTranslations((prev) => sanitizeTranslations(newSchema, prev));
  };

  const addStep = () => {
    const existingKeys = new Set(schema.steps.map((s) => s.key));
    let idx = schema.steps.length + 1;
    while (existingKeys.has(`step_${idx}`)) idx++;
    setSchemaClean({ steps: [...schema.steps, { key: `step_${idx}`, fields: [] }] });
  };

  const updateStep = (index: number, step: FormStep) => {
    setSchemaClean({ steps: schema.steps.map((s, i) => (i === index ? step : s)) });
  };

  const removeStep = (index: number) => {
    setSchemaClean({ steps: schema.steps.filter((_, i) => i !== index) });
  };

  const handleSave = () => {
    const cleanTranslations = sanitizeTranslations(schema, translations);
    setTranslations(cleanTranslations);
    const cleanCurrent = cleanTranslations[activeLocale] ?? emptyTranslation();

    const payload = {
      service_id: serviceId,
      city_id: cityId,
      schema,
      locale: activeLocale,
      ...cleanCurrent,
    };
    startTransition(async () => {
      const result = await onSave(payload);

      if (result && 'error' in result) {
        const errors = result.error as Record<string, string[] | undefined>;
        const firstMsg = Object.values(errors).flat().filter(Boolean)[0];
        toast.error(firstMsg ?? tc('saveError'));
        return;
      }

      toast.success(tc('savedSuccess'));

      // Sync parent with saved data
      if (onSaved) {
        const saved = await onGetForm(serviceId, cityId);
        if (saved) onSaved(saved);
      }
    });
  };

  return (
    <div className="space-y-4">
      {schema.steps.length === 0 && (
        <p className="text-muted-foreground py-4">{t('noSteps')}</p>
      )}

      {schema.steps.map((step, index) => (
        <StepCard
          key={index}
          step={step}
          stepIndex={index}
          totalSteps={schema.steps.length}
          translations={current}
          subtypeGroups={subtypeGroups}
          surveyQuestions={surveyQuestions}
          allowedTables={allowedTables}
          onChange={(s) => updateStep(index, s)}
          onRemove={() => removeStep(index)}
          onMoveUp={() => setSchema({ steps: swap(schema.steps, index, index - 1) })}
          onMoveDown={() => setSchema({ steps: swap(schema.steps, index, index + 1) })}
          onLabelChange={setLabel}
          onPlaceholderChange={setPlaceholder}
          onOptionLabelChange={setOptionLabel}
        />
      ))}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={addStep}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addStep')}
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? t('saving') : t('save')}
        </Button>
      </div>
    </div>
  );
}
