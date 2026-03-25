'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { saveForm } from '../actions/save-form';
import type { FormSchema, FormStep, FormWithTranslations } from '../types';
import { StepCard } from './step-card';

type Props = {
  serviceId: string;
  form: FormWithTranslations | null;
};

function swap<T>(arr: T[], i: number, j: number): T[] {
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

export function FormBuilder({ serviceId, form }: Props) {
  const t = useTranslations('AdminFormBuilder');
  const [isPending, startTransition] = useTransition();
  const [schema, setSchema] = useState<FormSchema>(
    form?.schema ?? { steps: [] }
  );

  const addStep = () => {
    const key = `step_${schema.steps.length + 1}`;
    setSchema({
      steps: [...schema.steps, { key, fields: [] }],
    });
  };

  const updateStep = (index: number, step: FormStep) => {
    setSchema({
      steps: schema.steps.map((s, i) => (i === index ? step : s)),
    });
  };

  const removeStep = (index: number) => {
    setSchema({
      steps: schema.steps.filter((_, i) => i !== index),
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      await saveForm({
        service_id: serviceId,
        country_id: null,
        schema,
      });
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{t('title')}</h3>

      {schema.steps.length === 0 && (
        <p className="text-muted-foreground py-4">{t('noSteps')}</p>
      )}

      {schema.steps.map((step, index) => (
        <StepCard
          key={index}
          step={step}
          stepIndex={index}
          totalSteps={schema.steps.length}
          onChange={(s) => updateStep(index, s)}
          onRemove={() => removeStep(index)}
          onMoveUp={() => setSchema({ steps: swap(schema.steps, index, index - 1) })}
          onMoveDown={() => setSchema({ steps: swap(schema.steps, index, index + 1) })}
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
