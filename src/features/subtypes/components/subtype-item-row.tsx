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

function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^[^a-z]+/, '');
}

export function SubtypeItemRow({ item, locale, isPrimary, onChange, onRemove }: Props) {
  const t = useTranslations('AdminSubtypes');

  return (
    <div className="flex items-center gap-2">
      <Input
        value={item.slug}
        onChange={(e) => onChange({ ...item, slug: sanitizeSlug(e.target.value) })}
        placeholder={t('itemSlug')}
        className="h-7 w-32 text-xs"
        readOnly={!isPrimary}
        tabIndex={isPrimary ? undefined : -1}
      />
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
