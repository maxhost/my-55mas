'use client';

import { useTranslations } from 'next-intl';
import { Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { FaqInput } from '../types';

type Props = {
  faq: FaqInput;
  locale: string;
  isPrimary: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onChange: (next: FaqInput) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export function FaqRow({
  faq,
  locale,
  isPrimary,
  canMoveUp,
  canMoveDown,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: Props) {
  const t = useTranslations('AdminFaqs');
  const current = faq.translations[locale] ?? { question: '', answer: '' };

  const updateField = (field: 'question' | 'answer', value: string) => {
    onChange({
      ...faq,
      translations: {
        ...faq.translations,
        [locale]: { ...current, [field]: value },
      },
    });
  };

  return (
    <div className="rounded-md border border-border bg-card p-4 space-y-3">
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-3">
          <div className="space-y-1">
            <Label>
              {t('question')} ({locale.toUpperCase()})
            </Label>
            <Input
              value={current.question}
              maxLength={500}
              onChange={(e) => updateField('question', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>
              {t('answer')} ({locale.toUpperCase()})
            </Label>
            <Textarea
              rows={4}
              value={current.answer}
              maxLength={5000}
              onChange={(e) => updateField('answer', e.target.value)}
            />
          </div>
        </div>

        <div className="shrink-0 flex flex-col gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!canMoveUp}
            onClick={onMoveUp}
            aria-label={t('moveUp')}
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            aria-label={t('moveDown')}
          >
            <ArrowDown className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label={t('remove')}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      {isPrimary && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={faq.is_active}
            onChange={(e) =>
              onChange({ ...faq, is_active: e.target.checked })
            }
            className="size-4"
          />
          {t('isActive')}
        </label>
      )}
    </div>
  );
}
