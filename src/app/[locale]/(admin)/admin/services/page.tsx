import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { getServices } from '@/features/services/actions/get-services';
import { ServicesList } from '@/features/services/components/services-list';

type Props = { params: { locale: string } };

export default async function ServicesPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminServices');
  const { data: services } = await getServices({ locale });

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>
      <ServicesList services={services} />
    </div>
  );
}
