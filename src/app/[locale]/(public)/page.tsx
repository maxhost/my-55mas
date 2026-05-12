import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

type Props = { params: { locale: string } };

// Home (fase 1.1 placeholder). Real sections land in fase 2.
// Header + navbar come from (public)/layout.tsx.
export default async function PublicHomePage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('Placeholder');

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-24 text-center">
      <h1 className="text-5xl font-bold text-brand-text">
        55<span className="text-brand-coral">+</span>
      </h1>
      <p className="mt-3 text-lg text-brand-text-soft">{t('comingSoon')}</p>
    </section>
  );
}
