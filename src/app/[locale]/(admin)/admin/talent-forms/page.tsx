import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { listTalentForms } from '@/features/talent-forms/actions/list-talent-forms';
import { PageHeader } from '@/shared/components/page-header';
import { TalentFormsList } from './talent-forms-list';

type Props = { params: { locale: string } };

export default async function TalentFormsPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminTalentForms');
  const supabase = createClient();

  const [forms, { data: allServices }] = await Promise.all([
    listTalentForms(locale),
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
      <TalentFormsList forms={forms} availableServices={availableServices} />
    </div>
  );
}
