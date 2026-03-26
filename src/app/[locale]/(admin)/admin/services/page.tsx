import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { getServices } from '@/features/services/actions/get-services';
import { ServicesList } from '@/features/services/components/services-list';
import { PageHeader } from '@/shared/components/page-header';

type Props = { params: { locale: string } };

export default async function ServicesPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminServices');
  const { data: services } = await getServices({ locale });

  return (
    <div className="p-8">
      <PageHeader title={t('title')} />
      <ServicesList services={services} />
    </div>
  );
}
