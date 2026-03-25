'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

type Props = {
  fieldKey: string;
  options: string[];
  optionLabels: Record<string, string>;
  onChange: (options: string[]) => void;
  onOptionLabelChange: (compositeKey: string, value: string) => void;
};

export function FieldOptionsEditor({ fieldKey, options, optionLabels, onChange, onOptionLabelChange }: Props) {
  const t = useTranslations('AdminFormBuilder');

  const add = () => onChange([...options, '']);
  const remove = (index: number) =>
    onChange(options.filter((_, i) => i !== index));
  const update = (index: number, value: string) =>
    onChange(options.map((opt, i) => (i === index ? value : opt)));

  return (
    <div className="ml-6 space-y-1">
      <span className="text-muted-foreground text-xs">{t('options')}</span>
      {options.map((opt, index) => {
        const compositeKey = `${fieldKey}.${opt}`;
        return (
          <div key={index} className="flex items-center gap-1">
            <Input
              value={opt}
              onChange={(e) => update(index, e.target.value)}
              placeholder={`option_${index + 1}`}
              className="h-7 w-32 text-xs"
            />
            <Input
              value={optionLabels[compositeKey] ?? ''}
              onChange={(e) => onOptionLabelChange(compositeKey, e.target.value)}
              placeholder={t('optionLabel')}
              className="h-7 flex-1 text-xs"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => remove(index)}
            >
              <X />
            </Button>
          </div>
        );
      })}
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={add}
        className="text-xs"
      >
        <Plus className="mr-1 h-3 w-3" />
        {t('addOption')}
      </Button>
    </div>
  );
}
