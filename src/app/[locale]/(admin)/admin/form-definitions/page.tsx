import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { listFormDefinitions } from '@/features/form-definitions/actions/list';
import { FormDefinitionsList } from '@/features/form-definitions/components/form-definitions-list';
import { PageHeader } from '@/shared/components/page-header';

type Props = { params: { locale: string } };

export default async function FormDefinitionsListPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminFormDefinitions');
  const formDefinitions = await listFormDefinitions();

  return (
    <div className="p-8">
      <PageHeader title={t('title')} />
      <p className="text-muted-foreground mb-4 text-sm">{t('description')}</p>
      <FormDefinitionsList formDefinitions={formDefinitions} locale={locale} />
    </div>
  );
}
