'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { SubtypeItemInput } from '../types';

type Props = {
  item: SubtypeItemInput;
  locale: string;
  isPrimary: boolean;
  onChange: (item: SubtypeItemInput) => void;
  onRemove: () => void;
};

export function SubtypeItemRow({ item, locale, isPrimary, onChange, onRemove }: Props) {
  const t = useTranslations('AdminSubtypes');

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground rounded bg-muted px-2 py-0.5 font-mono text-xs">
        {item.slug}
      </span>
      <Input
        value={item.translations[locale] ?? ''}
        onChange={(e) =>
          onChange({
            ...item,
            translations: { ...item.translations, [locale]: e.target.value },
          })
        }
        placeholder={t('namePlaceholder')}
        className="h-7 flex-1 text-xs"
      />
      <label className="flex items-center gap-1 text-xs whitespace-nowrap">
        <input
          type="checkbox"
          checked={item.is_active}
          onChange={(e) => onChange({ ...item, is_active: e.target.checked })}
          className="h-3 w-3"
          disabled={!isPrimary}
        />
        {t('active')}
      </label>
      {isPrimary && (
        <Button type="button" variant="ghost" size="icon-xs" onClick={onRemove}>
          <X />
        </Button>
      )}
    </div>
  );
}
