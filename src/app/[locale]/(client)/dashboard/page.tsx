import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

type Props = { params: { locale: string } };

export default async function ClientDashboardPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('Placeholder');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{t('clientArea')}</h1>
    </div>
  );
}
