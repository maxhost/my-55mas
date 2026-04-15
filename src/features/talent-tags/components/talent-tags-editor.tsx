'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { locales } from '@/lib/i18n/config';
import { saveTag } from '../actions/save-tag';
import { deleteTag } from '../actions/delete-tag';
import type { TalentTagInput, TalentTagWithTranslations } from '../types';
import { TalentTagRow } from './talent-tag-row';

type Props = {
  initialTags: TalentTagWithTranslations[];
};

function toInput(tag: TalentTagWithTranslations): TalentTagInput {
  return {
    id: tag.id,
    slug: tag.slug,
    sort_order: tag.sort_order,
    is_active: tag.is_active,
    translations: { ...tag.translations },
  };
}

export function TalentTagsEditor({ initialTags }: Props) {
  const t = useTranslations('AdminTalentTags');
  const tc = useTranslations('Common');
  const [isPending, startTransition] = useTransition();
  const [tags, setTags] = useState<TalentTagInput[]>(initialTags.map(toInput));
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const primaryLocale = locales[0];

  const addTag = () => {
    setTags([
      ...tags,
      {
        slug: `tag_${Date.now().toString(36)}`,
        sort_order: tags.length,
        is_active: true,
        translations: {},
      },
    ]);
  };

  const updateTag = (index: number, tag: TalentTagInput) => {
    setTags(tags.map((g, i) => (i === index ? tag : g)));
  };

  const removeTag = (index: number) => {
    const tag = tags[index];
    if (tag.id) setRemovedIds([...removedIds, tag.id]);
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const normalized = tags.map((tag, i) => ({ ...tag, sort_order: i }));

    startTransition(async () => {
      for (const id of removedIds) {
        const result = await deleteTag(id);
        if ('error' in result) {
          toast.error(Object.values(result.error).flat()[0] ?? tc('saveError'));
          return;
        }
      }

      for (const tag of normalized) {
        const result = await saveTag({ tag });
        if ('error' in result) {
          const msg = Object.values(result.error).flat().filter(Boolean)[0];
          toast.error(msg ?? tc('saveError'));
          return;
        }
      }

      toast.success(tc('savedSuccess'));
      setTags(normalized);
      setRemovedIds([]);
    });
  };

  return (
    <div className="space-y-4">
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
          <TabsContent key={locale} value={locale} className="space-y-2 pt-3">
            {tags.length === 0 && (
              <p className="text-muted-foreground py-4 text-sm">{t('noTags')}</p>
            )}

            {tags.map((tag, index) => (
              <TalentTagRow
                key={tag.id ?? `new-${index}`}
                tag={tag}
                locale={locale}
                isPrimary={locale === primaryLocale}
                onChange={(g) => updateTag(index, g)}
                onRemove={() => removeTag(index)}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={addTag}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addTag')}
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? t('saving') : t('save')}
        </Button>
      </div>
    </div>
  );
}
