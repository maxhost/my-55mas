import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

type Props = { params: { locale: string } };

export default async function TalentOnboardingPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('TalentRegistration');

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">{t('onboardingPlaceholderHeading')}</h1>
      <p className="mt-4 text-muted-foreground">{t('onboardingPlaceholderBody')}</p>
    </main>
  );
}
