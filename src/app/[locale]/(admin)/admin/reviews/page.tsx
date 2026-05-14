import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { listReviews } from '@/features/reviews/actions/list-reviews';
import { ReviewsEditor } from '@/features/reviews/components/reviews-editor';

type Props = { params: { locale: string } };

export default async function ReviewsPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminReviews');
  const reviews = await listReviews();

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <ReviewsEditor initialReviews={reviews} />
    </div>
  );
}
