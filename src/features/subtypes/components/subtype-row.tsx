'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, X } from 'lucide-react';
import { locales } from '@/lib/i18n/config';
import type { SubtypeInput } from '../types';

type Props = {
  subtype: SubtypeInput;
  index: number;
  total: number;
  onChange: (subtype: SubtypeInput) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^[^a-z]+/, '');
}

export function SubtypeRow({
  subtype,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: Props) {
  const t = useTranslations('AdminSubtypes');

  return (
    <div className="border-border space-y-2 rounded-md border p-3">
      <div className="flex items-center gap-2">
        <Input
          value={subtype.slug}
          onChange={(e) => onChange({ ...subtype, slug: sanitizeSlug(e.target.value) })}
          placeholder={t('slugPlaceholder')}
          className="h-8 w-40 text-sm"
        />
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={subtype.is_active}
            onChange={(e) => onChange({ ...subtype, is_active: e.target.checked })}
            className="h-3 w-3"
          />
          {t('active')}
        </label>
        <div className="ml-auto flex gap-0.5">
          <Button type="button" variant="ghost" size="icon-xs" onClick={onMoveUp} disabled={index === 0}>
            <ArrowUp />
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" onClick={onMoveDown} disabled={index === total - 1}>
            <ArrowDown />
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" onClick={onRemove}>
            <X />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {locales.map((locale) => (
          <div key={locale} className="space-y-0.5">
            <span className="text-muted-foreground text-xs uppercase">{locale}</span>
            <Input
              value={subtype.translations[locale] ?? ''}
              onChange={(e) =>
                onChange({
                  ...subtype,
                  translations: { ...subtype.translations, [locale]: e.target.value },
                })
              }
              placeholder={t('namePlaceholder')}
              className="h-7 text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
