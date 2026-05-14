import { unstable_setRequestLocale, getTranslations } from 'next-intl/server';
import { loadPublicFaqs } from '@/features/faqs/lib/load-public-faqs';
import { PublicFaqAccordion } from '@/features/faqs/components/public-faq-accordion';
import { buildPublicMetadata } from '@/shared/lib/seo';

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props) {
  return buildPublicMetadata({
    locale,
    namespace: 'legal.faq.meta',
    path: '/preguntas-frecuentes',
  });
}

export default async function FaqPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const [t, faqs] = await Promise.all([
    getTranslations('legal.faq'),
    loadPublicFaqs(locale),
  ]);

  return (
    <>
      <h1 className="m-0 mb-3 text-3xl font-bold text-brand-text md:text-[2rem]">
        {t('title')}
      </h1>
      <p className="mb-8 text-[0.98rem] leading-relaxed text-brand-text">
        {t('subtitle')}
      </p>
      {faqs.length === 0 ? (
        <p className="text-brand-text/70">{t('empty')}</p>
      ) : (
        <PublicFaqAccordion items={faqs} />
      )}
    </>
  );
}
