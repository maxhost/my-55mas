'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { locales } from '@/lib/i18n/config';
import { saveFaq } from '../actions/save-faq';
import { deleteFaq } from '../actions/delete-faq';
import type { FaqInput, FaqWithTranslations } from '../types';
import { FaqRow } from './faq-row';

type Props = {
  initialFaqs: FaqWithTranslations[];
};

function toInput(f: FaqWithTranslations): FaqInput {
  return {
    id: f.id,
    sort_order: f.sort_order,
    is_active: f.is_active,
    translations: { ...f.translations },
  };
}

export function FaqsEditor({ initialFaqs }: Props) {
  const t = useTranslations('AdminFaqs');
  const tc = useTranslations('Common');
  const [isPending, startTransition] = useTransition();
  const [faqs, setFaqs] = useState<FaqInput[]>(initialFaqs.map(toInput));
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const primaryLocale = locales[0];

  const addFaq = () => {
    setFaqs([
      ...faqs,
      {
        sort_order: faqs.length,
        is_active: true,
        translations: { es: { question: '', answer: '' } },
      },
    ]);
  };

  const updateAt = (index: number, next: FaqInput) => {
    setFaqs(faqs.map((f, i) => (i === index ? next : f)));
  };

  const removeAt = (index: number) => {
    const f = faqs[index];
    if (f.id) setRemovedIds([...removedIds, f.id]);
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const swap = (i: number, j: number) => {
    if (j < 0 || j >= faqs.length) return;
    const next = [...faqs];
    [next[i], next[j]] = [next[j], next[i]];
    setFaqs(next);
  };

  const handleSave = () => {
    const normalized = faqs.map((f, i) => ({ ...f, sort_order: i }));

    startTransition(async () => {
      for (const id of removedIds) {
        const result = await deleteFaq(id);
        if ('error' in result) {
          toast.error(
            Object.values(result.error).flat()[0] ?? tc('saveError'),
          );
          return;
        }
      }

      for (const faq of normalized) {
        const result = await saveFaq({ faq });
        if ('error' in result) {
          const msg = Object.values(result.error).flat().filter(Boolean)[0];
          toast.error(msg ?? tc('saveError'));
          return;
        }
      }

      toast.success(tc('savedSuccess'));
      setFaqs(normalized);
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
          <TabsContent
            key={locale}
            value={locale}
            className="space-y-3 pt-3"
          >
            {faqs.length === 0 && (
              <p className="text-muted-foreground py-4 text-sm">
                {t('noFaqs')}
              </p>
            )}

            {faqs.map((faq, index) => (
              <FaqRow
                key={faq.id ?? `new-${index}`}
                faq={faq}
                locale={locale}
                isPrimary={locale === primaryLocale}
                canMoveUp={index > 0}
                canMoveDown={index < faqs.length - 1}
                onChange={(next) => updateAt(index, next)}
                onRemove={() => removeAt(index)}
                onMoveUp={() => swap(index, index - 1)}
                onMoveDown={() => swap(index, index + 1)}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={addFaq}>
          <Plus className="mr-2 size-4" />
          {t('addFaq')}
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? tc('saving') : tc('save')}
        </Button>
      </div>
    </div>
  );
}
