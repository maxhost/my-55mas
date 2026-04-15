import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { listSpokenLanguages } from '@/features/spoken-languages';
import { SpokenLanguagesEditor } from '@/features/spoken-languages/components/spoken-languages-editor';
import { PageHeader } from '@/shared/components/page-header';

type Props = { params: { locale: string } };

export default async function SpokenLanguagesPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminSpokenLanguages');
  const result = await listSpokenLanguages();

  return (
    <div className="p-8">
      <PageHeader title={t('title')} />
      {result.ok ? (
        <SpokenLanguagesEditor initialLanguages={result.data} />
      ) : (
        <p className="text-destructive text-sm">{t('loadError')}</p>
      )}
    </div>
  );
}
