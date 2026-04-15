'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import type { SubtypeGroupInput, SubtypeItemInput } from '../types';
import { SubtypeItemRow } from './subtype-item-row';
import { slugify } from '@/shared/lib/slugify';

type Props = {
  group: SubtypeGroupInput;
  locale: string;
  isPrimary: boolean;
  index: number;
  total: number;
  onChange: (group: SubtypeGroupInput) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export function SubtypeGroupCard({
  group,
  locale,
  isPrimary,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: Props) {
  const t = useTranslations('AdminSubtypes');
  const [collapsed, setCollapsed] = useState(false);

  const updateItem = (itemIndex: number, item: SubtypeItemInput) => {
    const items = group.items.map((it, i) => (i === itemIndex ? item : it));
    onChange({ ...group, items });
  };

  const removeItem = (itemIndex: number) => {
    onChange({ ...group, items: group.items.filter((_, i) => i !== itemIndex) });
  };

  const addItem = () => {
    onChange({
      ...group,
      items: [
        ...group.items,
        {
          slug: `item-${Date.now().toString(36)}`,
          sort_order: group.items.length,
          is_active: true,
          translations: {},
        },
      ],
    });
  };

  return (
    <div className="border-border rounded-md border">
      {/* Header */}
      <div className="flex items-center gap-2 bg-muted/50 p-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight /> : <ChevronDown />}
        </Button>

        <span className="text-muted-foreground rounded bg-muted px-2 py-0.5 font-mono text-xs">
          {group.slug}
        </span>

        <Input
          value={group.translations[locale] ?? ''}
          onChange={(e) => {
            const name = e.target.value;
            const updated = {
              ...group,
              translations: { ...group.translations, [locale]: name },
            };
            // Auto-derive slug from primary locale name
            if (isPrimary) updated.slug = slugify(name);
            onChange(updated);
          }}
          placeholder={t('groupName')}
          className="h-7 w-48 text-xs"
        />

        <label className="flex items-center gap-1 text-xs whitespace-nowrap">
          <input
            type="checkbox"
            checked={group.is_active}
            onChange={(e) => onChange({ ...group, is_active: e.target.checked })}
            className="h-3 w-3"
            disabled={!isPrimary}
          />
          {t('active')}
        </label>

        {isPrimary && (
          <div className="ml-auto flex gap-0.5">
            <Button type="button" variant="ghost" size="icon-xs" onClick={onMoveUp} disabled={index === 0}>
              <ArrowUp />
            </Button>
            <Button type="button" variant="ghost" size="icon-xs" onClick={onMoveDown} disabled={index === total - 1}>
              <ArrowDown />
            </Button>
            <Button type="button" variant="ghost" size="icon-xs" onClick={onRemove}>
              <Trash2 />
            </Button>
          </div>
        )}
      </div>

      {/* Items */}
      {!collapsed && (
        <div className="space-y-2 p-3">
          {group.items.length === 0 && (
            <p className="text-muted-foreground text-xs">{t('noItems')}</p>
          )}

          {group.items.map((item, itemIndex) => (
            <SubtypeItemRow
              key={item.id ?? `new-${itemIndex}`}
              item={item}
              locale={locale}
              isPrimary={isPrimary}
              onChange={(updated) => updateItem(itemIndex, updated)}
              onRemove={() => removeItem(itemIndex)}
            />
          ))}

          {isPrimary && (
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-1 h-3 w-3" />
              {t('addItem')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
