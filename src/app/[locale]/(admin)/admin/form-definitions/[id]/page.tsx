import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { ChevronLeft } from 'lucide-react';
import { getFormDefinitionDetail } from '@/features/form-definitions/actions/get-detail';
import { FormDefinitionEditor } from '@/features/form-definitions/components/form-definition-editor';
import { listActiveCountries } from '@/shared/lib/countries/list-active-countries';
import { PageHeader } from '@/shared/components/page-header';

type Props = { params: { locale: string; id: string } };

export default async function FormDefinitionEditorPage({ params: { locale, id } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminFormDefinitions');

  const [detail, countries] = await Promise.all([
    getFormDefinitionDetail(id),
    listActiveCountries(locale),
  ]);

  if (!detail) notFound();

  return (
    <div className="p-8">
      <Link
        href={`/${locale}/admin/form-definitions`}
        className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-xs"
      >
        <ChevronLeft className="h-3 w-3" />
        {t('backToList')}
      </Link>
      <PageHeader title={`${t('title')}: ${detail.form_key}`} />
      <FormDefinitionEditor formDefinition={detail} countries={countries} />
    </div>
  );
}
