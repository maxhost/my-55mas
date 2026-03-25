'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowUp, ArrowDown, X, Plus } from 'lucide-react';
import type { FormStep, FormField } from '../types';
import { FieldEditor } from './field-editor';

type Props = {
  step: FormStep;
  stepIndex: number;
  totalSteps: number;
  onChange: (step: FormStep) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

function swap<T>(arr: T[], i: number, j: number): T[] {
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

export function StepCard({
  step,
  stepIndex,
  totalSteps,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: Props) {
  const t = useTranslations('AdminFormBuilder');

  const addField = () => {
    const newField: FormField = {
      key: '',
      type: 'text',
      required: false,
    };
    onChange({ ...step, fields: [...step.fields, newField] });
  };

  const updateField = (fieldIndex: number, field: FormField) => {
    const fields = step.fields.map((f, i) => (i === fieldIndex ? field : f));
    onChange({ ...step, fields });
  };

  const removeField = (fieldIndex: number) => {
    onChange({ ...step, fields: step.fields.filter((_, i) => i !== fieldIndex) });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
        <span className="text-muted-foreground text-sm font-medium">
          {t('stepTitle', { number: stepIndex + 1 })}
        </span>
        <Input
          value={step.key}
          onChange={(e) => onChange({ ...step, key: e.target.value })}
          placeholder={t('stepKey')}
          className="h-8 w-40 text-sm"
        />
        <div className="ml-auto flex gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onMoveUp}
            disabled={stepIndex === 0}
          >
            <ArrowUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onMoveDown}
            disabled={stepIndex === totalSteps - 1}
          >
            <ArrowDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onRemove}
          >
            <X />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {step.fields.length === 0 && (
          <p className="text-muted-foreground text-sm">{t('noFields')}</p>
        )}
        {step.fields.map((field, fieldIndex) => (
          <FieldEditor
            key={fieldIndex}
            field={field}
            index={fieldIndex}
            total={step.fields.length}
            onChange={(f) => updateField(fieldIndex, f)}
            onRemove={() => removeField(fieldIndex)}
            onMoveUp={() =>
              onChange({ ...step, fields: swap(step.fields, fieldIndex, fieldIndex - 1) })
            }
            onMoveDown={() =>
              onChange({ ...step, fields: swap(step.fields, fieldIndex, fieldIndex + 1) })
            }
          />
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addField}
        >
          <Plus className="mr-1 h-3 w-3" />
          {t('addField')}
        </Button>
      </CardContent>
    </Card>
  );
}
