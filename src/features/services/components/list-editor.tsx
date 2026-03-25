'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUp, ArrowDown, X, Plus } from 'lucide-react';

type Props = {
  items: string[];
  onChange: (items: string[]) => void;
  label: string;
};

export function ListEditor({ items, onChange, label }: Props) {
  const t = useTranslations('AdminServices');

  const add = () => onChange([...items, '']);
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const update = (index: number, value: string) =>
    onChange(items.map((item, i) => (i === index ? value : item)));

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...items];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  };

  const moveDown = (index: number) => {
    if (index === items.length - 1) return;
    const next = [...items];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={item}
            onChange={(e) => update(index, e.target.value)}
            className="flex-1"
          />
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
            disabled={index === items.length - 1}
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
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="mr-1 h-3 w-3" />
        {t('addItem')}
      </Button>
    </div>
  );
}
