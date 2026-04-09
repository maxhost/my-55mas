import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/shared/components/page-header';
import { MigrationWizard } from '@/features/migration/components/migration-wizard';

type Props = { params: { locale: string } };

export default async function MigrationPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminMigration');

  return (
    <div className="p-8">
      <PageHeader title={t('title')} />
      <MigrationWizard locale={locale} />
    </div>
  );
}
