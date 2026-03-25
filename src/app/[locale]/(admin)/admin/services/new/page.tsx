import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { CreateServiceForm } from '@/features/services/components/create-service-form';

type Props = { params: { locale: string } };

export default async function NewServicePage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminServices');

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">{t('createService')}</h1>
      <CreateServiceForm />
    </div>
  );
}
