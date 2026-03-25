'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowUp, ArrowDown, X, Plus } from 'lucide-react';
import type { FormStep, FormField, FormTranslationData } from '../types';
import { sanitizeKey } from '../utils';
import { FieldEditor } from './field-editor';

type Props = {
  step: FormStep;
  stepIndex: number;
  totalSteps: number;
  translations: FormTranslationData;
  onChange: (step: FormStep) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onLabelChange: (key: string, value: string) => void;
  onPlaceholderChange: (key: string, value: string) => void;
  onOptionLabelChange: (compositeKey: string, value: string) => void;
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
  translations,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onLabelChange,
  onPlaceholderChange,
  onOptionLabelChange,
}: Props) {
  const t = useTranslations('AdminFormBuilder');

  const addField = () => {
    const existingKeys = new Set(step.fields.map((f) => f.key));
    let idx = step.fields.length + 1;
    while (existingKeys.has(`field_${idx}`)) idx++;
    const newField: FormField = { key: `field_${idx}`, type: 'text', required: false };
    onChange({ ...step, fields: [...step.fields, newField] });
  };

  const updateField = (fieldIndex: number, field: FormField) => {
    onChange({ ...step, fields: step.fields.map((f, i) => (i === fieldIndex ? field : f)) });
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
          onChange={(e) => onChange({ ...step, key: sanitizeKey(e.target.value) })}
          placeholder={t('stepKey')}
          className="h-8 w-40 text-sm"
        />
        <div className="ml-auto flex gap-0.5">
          <Button type="button" variant="ghost" size="icon-xs" onClick={onMoveUp} disabled={stepIndex === 0}>
            <ArrowUp />
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" onClick={onMoveDown} disabled={stepIndex === totalSteps - 1}>
            <ArrowDown />
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" onClick={onRemove}>
            <X />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Step label translation */}
        <div className="space-y-1">
          <Label className="text-xs">{t('stepLabel')}</Label>
          <Input
            value={translations.labels[step.key] ?? ''}
            onChange={(e) => onLabelChange(step.key, e.target.value)}
            placeholder={t('stepLabel')}
            className="h-8 text-sm"
          />
        </div>

        {step.fields.length === 0 && (
          <p className="text-muted-foreground text-sm">{t('noFields')}</p>
        )}

        {step.fields.map((field, fieldIndex) => (
          <FieldEditor
            key={fieldIndex}
            field={field}
            index={fieldIndex}
            total={step.fields.length}
            label={translations.labels[field.key] ?? ''}
            placeholder={translations.placeholders[field.key] ?? ''}
            optionLabels={translations.option_labels}
            onChange={(f) => updateField(fieldIndex, f)}
            onRemove={() => removeField(fieldIndex)}
            onMoveUp={() => onChange({ ...step, fields: swap(step.fields, fieldIndex, fieldIndex - 1) })}
            onMoveDown={() => onChange({ ...step, fields: swap(step.fields, fieldIndex, fieldIndex + 1) })}
            onLabelChange={onLabelChange}
            onPlaceholderChange={onPlaceholderChange}
            onOptionLabelChange={onOptionLabelChange}
          />
        ))}

        <Button type="button" variant="outline" size="sm" onClick={addField}>
          <Plus className="mr-1 h-3 w-3" />
          {t('addField')}
        </Button>
      </CardContent>
    </Card>
  );
}
