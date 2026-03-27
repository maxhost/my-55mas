import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { listTalentServices } from '@/features/talent-services/actions/list-talent-services';
import { PageHeader } from '@/shared/components/page-header';
import { TalentServicesList } from './talent-services-list';

type Props = { params: { locale: string } };

export default async function TalentServicesPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminTalentServices');
  const supabase = createClient();

  const [forms, { data: allServices }] = await Promise.all([
    listTalentServices(locale),
    supabase
      .from('service_translations')
      .select('service_id, name')
      .eq('locale', locale),
  ]);

  // Services that don't have a talent form yet
  const serviceIdsWithForm = new Set(forms.map((f) => f.service_id));
  const availableServices = (allServices ?? [])
    .filter((s) => !serviceIdsWithForm.has(s.service_id))
    .map((s) => ({ id: s.service_id, name: s.name }));

  return (
    <div className="p-8">
      <PageHeader title={t('title')} />
      <TalentServicesList forms={forms} availableServices={availableServices} />
    </div>
  );
}
