import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

type Props = { params: { locale: string } };

export default async function HomePage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('Placeholder');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">55mas</h1>
      <p className="text-lg text-muted-foreground">{t('comingSoon')}</p>
    </main>
  );
}
