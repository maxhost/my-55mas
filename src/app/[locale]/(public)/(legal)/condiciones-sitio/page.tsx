import { unstable_setRequestLocale, getTranslations } from 'next-intl/server';
import { loadPublicLegalDocument } from '@/features/legal-documents/lib/load-public-legal-document';
import { PublicLegalDocument } from '@/features/legal-documents/components/public-legal-document';
import { buildPublicMetadata } from '@/shared/lib/seo';

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props) {
  return buildPublicMetadata({
    locale,
    namespace: 'legal.terms.meta',
    path: '/condiciones-sitio',
  });
}

export default async function TermsPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const [t, doc] = await Promise.all([
    getTranslations('legal.terms'),
    loadPublicLegalDocument('terms', locale),
  ]);

  if (!doc) {
    const tLegal = await getTranslations('legal');
    return <p className="text-brand-text/70">{tLegal('emptyDocument')}</p>;
  }

  return <PublicLegalDocument title={t('title')} richHtml={doc.richHtml} />;
}
