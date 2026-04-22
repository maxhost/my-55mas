import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { listFieldCatalog } from '@/features/field-catalog';
import { FieldCatalogManager } from '@/features/field-catalog/components/field-catalog-manager';
import { PageHeader } from '@/shared/components/page-header';
import { listSubtypeGroupsForPicker } from '@/shared/lib/field-catalog/subtype-groups';

type Props = { params: { locale: string } };

export default async function FieldCatalogPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminFieldCatalog');
  const supabase = createAdminClient();
  const [result, subtypeGroups] = await Promise.all([
    listFieldCatalog(),
    listSubtypeGroupsForPicker(supabase, locale),
  ]);

  return (
    <div className="p-8">
      <PageHeader title={t('title')} />
      {result.ok ? (
        <FieldCatalogManager
          initialGroups={result.data}
          subtypeGroups={subtypeGroups}
        />
      ) : (
        <p className="text-destructive text-sm">{t('loadError')}</p>
      )}
    </div>
  );
}
