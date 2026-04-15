import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { listTags } from '@/features/talent-tags/actions/list-tags';
import { PageHeader } from '@/shared/components/page-header';
import { TalentTagsEditor } from '@/features/talent-tags/components/talent-tags-editor';

type Props = { params: { locale: string } };

export default async function TalentTagsPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminTalentTags');
  const tags = await listTags();

  return (
    <div className="p-8">
      <PageHeader title={t('title')} />
      <TalentTagsEditor initialTags={tags} />
    </div>
  );
}
