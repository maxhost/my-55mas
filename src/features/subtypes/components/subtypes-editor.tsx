'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { locales } from '@/lib/i18n/config';
import { saveSubtypes } from '../actions/save-subtypes';
import type { SubtypeGroupWithTranslations, SubtypeGroupInput } from '../types';
import { SubtypeGroupCard } from './subtype-group-card';

type Props = {
  serviceId: string;
  initialSubtypes: SubtypeGroupWithTranslations[];
};

function toGroupInput(g: SubtypeGroupWithTranslations): SubtypeGroupInput {
  return {
    id: g.id,
    slug: g.slug,
    sort_order: g.sort_order,
    is_active: g.is_active,
    translations: { ...g.translations },
    items: g.items.map((item) => ({
      id: item.id,
      slug: item.slug,
      sort_order: item.sort_order,
      is_active: item.is_active,
      translations: { ...item.translations },
    })),
  };
}

function swap<T>(arr: T[], i: number, j: number): T[] {
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

export function SubtypesEditor({ serviceId, initialSubtypes }: Props) {
  const t = useTranslations('AdminSubtypes');
  const tc = useTranslations('Common');
  const [isPending, startTransition] = useTransition();
  const [groups, setGroups] = useState<SubtypeGroupInput[]>(
    initialSubtypes.map(toGroupInput)
  );

  const primaryLocale = locales[0]; // 'es'

  const addGroup = () => {
    const existingSlugs = new Set(groups.map((g) => g.slug));
    let idx = groups.length + 1;
    while (existingSlugs.has(`group_${idx}`)) idx++;
    setGroups([
      ...groups,
      {
        slug: `group_${idx}`,
        sort_order: groups.length,
        is_active: true,
        translations: {},
        items: [],
      },
    ]);
  };

  const updateGroup = (index: number, group: SubtypeGroupInput) => {
    setGroups(groups.map((g, i) => (i === index ? group : g)));
  };

  const removeGroup = (index: number) => {
    setGroups(groups.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Normalize sort_order from array position
    const normalized = groups.map((g, gi) => ({
      ...g,
      sort_order: gi,
      items: g.items.map((item, ii) => ({ ...item, sort_order: ii })),
    }));

    startTransition(async () => {
      const result = await saveSubtypes({
        service_id: serviceId,
        groups: normalized,
      });

      if (result && 'error' in result) {
        const errors = result.error as Record<string, string[] | undefined>;
        const firstMsg = Object.values(errors).flat().filter(Boolean)[0];
        toast.error(firstMsg ?? tc('saveError'));
        return;
      }

      toast.success(tc('savedSuccess'));
      setGroups(normalized);
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{t('title')}</h3>
      <p className="text-muted-foreground text-sm">{t('description')}</p>

      <Tabs defaultValue={primaryLocale}>
        <TabsList>
          {locales.map((locale) => (
            <TabsTrigger key={locale} value={locale}>
              {locale.toUpperCase()}
            </TabsTrigger>
          ))}
        </TabsList>

        {locales.map((locale) => (
          <TabsContent key={locale} value={locale} className="space-y-3 pt-3">
            {groups.length === 0 && (
              <p className="text-muted-foreground py-4">{t('noGroups')}</p>
            )}

            {groups.map((group, index) => (
              <SubtypeGroupCard
                key={group.id ?? `new-${index}`}
                group={group}
                locale={locale}
                isPrimary={locale === primaryLocale}
                index={index}
                total={groups.length}
                onChange={(g) => updateGroup(index, g)}
                onRemove={() => removeGroup(index)}
                onMoveUp={() => setGroups(swap(groups, index, index - 1))}
                onMoveDown={() => setGroups(swap(groups, index, index + 1))}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={addGroup}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addGroup')}
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? t('saving') : t('save')}
        </Button>
      </div>
    </div>
  );
}
