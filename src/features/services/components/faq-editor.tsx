'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, ArrowDown, X, Plus } from 'lucide-react';
import type { FaqItem } from '../types';

type Props = {
  faqs: FaqItem[];
  onChange: (faqs: FaqItem[]) => void;
};

export function FaqEditor({ faqs, onChange }: Props) {
  const t = useTranslations('AdminServices');

  const add = () => onChange([...faqs, { question: '', answer: '' }]);
  const remove = (index: number) => onChange(faqs.filter((_, i) => i !== index));

  const update = (index: number, field: keyof FaqItem, value: string) =>
    onChange(
      faqs.map((faq, i) => (i === index ? { ...faq, [field]: value } : faq))
    );

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...faqs];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  };

  const moveDown = (index: number) => {
    if (index === faqs.length - 1) return;
    const next = [...faqs];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <span className="text-sm font-medium">{t('faqs')}</span>
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="border-border space-y-2 rounded-lg border p-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              <Input
                placeholder={t('question')}
                value={faq.question}
                onChange={(e) => update(index, 'question', e.target.value)}
              />
              <Textarea
                placeholder={t('answer')}
                value={faq.answer}
                onChange={(e) => update(index, 'answer', e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => moveUp(index)}
                disabled={index === 0}
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => moveDown(index)}
                disabled={index === faqs.length - 1}
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => remove(index)}
              >
                <X />
              </Button>
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="mr-1 h-3 w-3" />
        {t('addItem')}
      </Button>
    </div>
  );
}
