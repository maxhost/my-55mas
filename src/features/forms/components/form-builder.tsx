'use client';

import { useState, useEffect, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { locales } from '@/lib/i18n/config';
import { saveFormWithTranslations } from '../actions/save-form';
import type {
  FormSchema,
  FormStep,
  FormTranslationData,
  FormWithTranslations,
} from '../types';
import { StepCard } from './step-card';

type Props = {
  serviceId: string;
  countryId: string | null;
  form: FormWithTranslations | null;
  activeLocale: string;
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
  return init;
}

export function FormBuilder({ serviceId, countryId, form, activeLocale }: Props) {
  const t = useTranslations('AdminFormBuilder');
  const [isPending, startTransition] = useTransition();
  const [schema, setSchema] = useState<FormSchema>(form?.schema ?? { steps: [] });
  const [translations, setTranslations] = useState(() => initTranslations(form));

  // Reset state when form prop changes (variant switch)
  useEffect(() => {
    setSchema(form?.schema ?? { steps: [] });
    setTranslations(initTranslations(form));
  }, [form]);

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

  const addStep = () => {
    const key = `step_${schema.steps.length + 1}`;
    setSchema({ steps: [...schema.steps, { key, fields: [] }] });
  };

  const updateStep = (index: number, step: FormStep) => {
    setSchema({ steps: schema.steps.map((s, i) => (i === index ? step : s)) });
  };

  const removeStep = (index: number) => {
    setSchema({ steps: schema.steps.filter((_, i) => i !== index) });
  };

  const handleSave = () => {
    startTransition(async () => {
      await saveFormWithTranslations({
        service_id: serviceId,
        country_id: countryId,
        schema,
        locale: activeLocale,
        ...current,
      });
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
