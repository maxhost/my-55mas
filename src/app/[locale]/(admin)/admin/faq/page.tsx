import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { listFaqs } from '@/features/faqs/actions/list-faqs';
import { FaqsEditor } from '@/features/faqs/components/faqs-editor';

type Props = { params: { locale: string } };

export default async function FaqPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminFaqs');
  const faqs = await listFaqs();

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <FaqsEditor initialFaqs={faqs} />
    </div>
  );
}
