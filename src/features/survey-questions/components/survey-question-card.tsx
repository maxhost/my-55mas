'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, X } from 'lucide-react';
import { RESPONSE_TYPES, type SurveyQuestionInput, type ResponseType } from '../types';

type Props = {
  question: SurveyQuestionInput;
  locale: string;
  isPrimary: boolean;
  onChange: (question: SurveyQuestionInput) => void;
  onRemove: () => void;
};

function sanitizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^[^a-z]+/, '');
}

export function SurveyQuestionCard({ question, locale, isPrimary, onChange, onRemove }: Props) {
  const t = useTranslations('AdminSurveyQuestions');
  const trans = question.translations[locale] ?? { label: '' };

  const updateTranslation = (updates: Partial<typeof trans>) => {
    onChange({
      ...question,
      translations: {
        ...question.translations,
        [locale]: { ...trans, ...updates },
      },
    });
  };

  const addOption = () => {
    const idx = (question.options?.length ?? 0) + 1;
    onChange({ ...question, options: [...(question.options ?? []), `option_${idx}`] });
  };

  const updateOption = (index: number, value: string) => {
    const opts = [...(question.options ?? [])];
    opts[index] = value;
    onChange({ ...question, options: opts });
  };

  const removeOption = (index: number) => {
    onChange({ ...question, options: (question.options ?? []).filter((_, i) => i !== index) });
  };

  const updateOptionLabel = (optKey: string, label: string) => {
    updateTranslation({
      option_labels: { ...(trans.option_labels ?? {}), [optKey]: label },
    });
  };

  return (
    <div className="border-border space-y-3 rounded-md border p-4">
      {/* Header: key + type + active + delete */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground rounded bg-muted px-2 py-1 font-mono text-xs">
          {question.key}
        </span>
        <select
          value={question.response_type}
          onChange={(e) => onChange({ ...question, response_type: e.target.value as ResponseType })}
          className="border-input bg-background h-8 rounded-md border px-2 text-sm"
          disabled={!isPrimary}
        >
          {RESPONSE_TYPES.map((rt) => (
            <option key={rt} value={rt}>{t(rt)}</option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-xs whitespace-nowrap">
          <input
            type="checkbox"
            checked={question.is_active}
            onChange={(e) => onChange({ ...question, is_active: e.target.checked })}
            className="h-3 w-3"
            disabled={!isPrimary}
          />
          {t('active')}
        </label>
        {isPrimary && (
          <Button type="button" variant="ghost" size="icon-xs" onClick={onRemove} className="ml-auto">
            <Trash2 />
          </Button>
        )}
      </div>

      {/* Label + description */}
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={trans.label}
          onChange={(e) => updateTranslation({ label: e.target.value })}
          placeholder={t('labelPlaceholder')}
          className="h-8 text-sm"
        />
        <Input
          value={trans.description ?? ''}
          onChange={(e) => updateTranslation({ description: e.target.value || undefined })}
          placeholder={t('descriptionPlaceholder')}
          className="h-8 text-sm"
        />
      </div>

      {/* Options (only for single_select) */}
      {question.response_type === 'single_select' && (
        <div className="space-y-1">
          <span className="text-muted-foreground text-xs">{t('options')}</span>
          {(question.options ?? []).map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              {isPrimary && (
                <Input
                  value={opt}
                  onChange={(e) => updateOption(i, sanitizeKey(e.target.value))}
                  placeholder="key"
                  className="h-7 w-28 text-xs"
                />
              )}
              <Input
                value={trans.option_labels?.[opt] ?? ''}
                onChange={(e) => updateOptionLabel(opt, e.target.value)}
                placeholder={t('optionLabel')}
                className="h-7 flex-1 text-xs"
              />
              {isPrimary && (
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeOption(i)}>
                  <X />
                </Button>
              )}
            </div>
          ))}
          {isPrimary && (
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              <Plus className="mr-1 h-3 w-3" />
              {t('addOption')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
