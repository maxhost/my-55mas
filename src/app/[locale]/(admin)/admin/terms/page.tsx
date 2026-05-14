import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { getLegalDocument } from '@/features/legal-documents/actions/get-legal-document';
import { LegalDocumentEditor } from '@/features/legal-documents/components/legal-document-editor';

type Props = { params: { locale: string } };

export default async function TermsPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminLegalDocuments');
  const doc = await getLegalDocument('terms');

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">{t('titleTerms')}</h1>
      <LegalDocumentEditor doc={doc} />
    </div>
  );
}
