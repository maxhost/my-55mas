import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { CreateServiceForm } from '@/features/services/components/create-service-form';
import { PageHeader } from '@/shared/components/page-header';

type Props = { params: { locale: string } };

export default async function NewServicePage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminServices');

  return (
    <div className="p-8">
      <PageHeader title={t('createService')} backHref="/admin/services" />
      <CreateServiceForm />
    </div>
  );
}
