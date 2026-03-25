'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

type Props = {
  options: string[];
  onChange: (options: string[]) => void;
};

export function FieldOptionsEditor({ options, onChange }: Props) {
  const t = useTranslations('AdminFormBuilder');

  const add = () => onChange([...options, '']);
  const remove = (index: number) =>
    onChange(options.filter((_, i) => i !== index));
  const update = (index: number, value: string) =>
    onChange(options.map((opt, i) => (i === index ? value : opt)));

  return (
    <div className="ml-6 space-y-1">
      <span className="text-muted-foreground text-xs">{t('options')}</span>
      {options.map((opt, index) => (
        <div key={index} className="flex items-center gap-1">
          <Input
            value={opt}
            onChange={(e) => update(index, e.target.value)}
            placeholder={`option_${index + 1}`}
            className="h-7 text-xs"
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
      ))}
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
