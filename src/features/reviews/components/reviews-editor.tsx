'use client';

import { useEffect, useState, useTransition } from 'react';
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
import { saveReview } from '../actions/save-review';
import { deleteReview } from '../actions/delete-review';
import type { ReviewInput, ReviewWithTranslations } from '../types';
import { ReviewRow } from './review-row';
import { ReviewsTranslateAiButton } from './reviews-translate-ai-button';

type Props = {
  initialReviews: ReviewWithTranslations[];
};

function toInput(r: ReviewWithTranslations): ReviewInput {
  return {
    id: r.id,
    author_name: r.author_name,
    author_photo: r.author_photo,
    stars: r.stars,
    sort_order: r.sort_order,
    is_active: r.is_active,
    translations: { ...r.translations },
  };
}

export function ReviewsEditor({ initialReviews }: Props) {
  const t = useTranslations('AdminReviews');
  const tc = useTranslations('Common');
  const [isPending, startTransition] = useTransition();
  const [reviews, setReviews] = useState<ReviewInput[]>(
    initialReviews.map(toInput),
  );
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  // Sync state when parent re-fetches (e.g. after router.refresh() following
  // the AI translate action). Without this, useState would keep the stale
  // reviews even though props updated.
  useEffect(() => {
    setReviews(initialReviews.map(toInput));
    setRemovedIds([]);
  }, [initialReviews]);

  const primaryLocale = locales[0];

  const addReview = () => {
    setReviews([
      ...reviews,
      {
        author_name: '',
        author_photo: null,
        stars: 5,
        sort_order: reviews.length,
        is_active: true,
        translations: {},
      },
    ]);
  };

  const updateAt = (index: number, next: ReviewInput) => {
    setReviews(reviews.map((r, i) => (i === index ? next : r)));
  };

  const removeAt = (index: number) => {
    const r = reviews[index];
    if (r.id) setRemovedIds([...removedIds, r.id]);
    setReviews(reviews.filter((_, i) => i !== index));
  };

  const swap = (i: number, j: number) => {
    if (j < 0 || j >= reviews.length) return;
    const next = [...reviews];
    [next[i], next[j]] = [next[j], next[i]];
    setReviews(next);
  };

  const handleSave = () => {
    const normalized = reviews.map((r, i) => ({ ...r, sort_order: i }));

    startTransition(async () => {
      for (const id of removedIds) {
        const result = await deleteReview(id);
        if ('error' in result) {
          toast.error(
            Object.values(result.error).flat()[0] ?? tc('saveError'),
          );
          return;
        }
      }

      for (const review of normalized) {
        const result = await saveReview({ review });
        if ('error' in result) {
          const msg = Object.values(result.error).flat().filter(Boolean)[0];
          toast.error(msg ?? tc('saveError'));
          return;
        }
      }

      toast.success(tc('savedSuccess'));
      setReviews(normalized);
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
            {reviews.length === 0 && (
              <p className="text-muted-foreground py-4 text-sm">
                {t('noReviews')}
              </p>
            )}

            {reviews.map((review, index) => (
              <ReviewRow
                key={review.id ?? `new-${index}`}
                review={review}
                locale={locale}
                isPrimary={locale === primaryLocale}
                canMoveUp={index > 0}
                canMoveDown={index < reviews.length - 1}
                onChange={(next) => updateAt(index, next)}
                onRemove={() => removeAt(index)}
                onMoveUp={() => swap(index, index - 1)}
                onMoveDown={() => swap(index, index + 1)}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={addReview}>
          <Plus className="mr-2 size-4" />
          {t('addReview')}
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? tc('saving') : tc('save')}
        </Button>
        <ReviewsTranslateAiButton reviews={reviews} />
      </div>
    </div>
  );
}
