import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { listAllSubtypes } from '@/features/subtypes/actions/list-all-subtypes';
import { PageHeader } from '@/shared/components/page-header';
import { SubtypesEditor } from '@/features/subtypes/components/subtypes-editor';

type Props = { params: { locale: string } };

export default async function SubtypesPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminSubtypes');
  const subtypes = await listAllSubtypes();

  return (
    <div className="p-8">
      <PageHeader title={t('title')} />
      <SubtypesEditor initialSubtypes={subtypes} />
    </div>
  );
}
