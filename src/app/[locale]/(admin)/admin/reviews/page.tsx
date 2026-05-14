import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

type Props = { params: { locale: string } };

export default async function ReviewsPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const tNav = await getTranslations('AdminNav');
  const t = await getTranslations('Placeholder');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{tNav('reviews')}</h1>
      <p className="mt-4 text-muted-foreground">{t('adminArea')}</p>
    </div>
  );
}
