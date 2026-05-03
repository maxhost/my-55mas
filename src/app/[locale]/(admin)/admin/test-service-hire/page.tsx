import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { listPublishedServices } from '@/features/service-hire/actions/list-published-services';
import { PageHeader } from '@/shared/components/page-header';
import { TestServiceHirePage } from './test-page';

type Props = { params: { locale: string } };

export default async function TestServiceHireRoute({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminTestServiceHire');
  const services = await listPublishedServices(locale);

  return (
    <div className="p-8">
      <PageHeader title={t('title')} />
      <p className="text-muted-foreground mb-6 text-sm">{t('description')}</p>
      <TestServiceHirePage services={services} locale={locale} />
    </div>
  );
}
