import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { listFieldCatalog } from '@/features/field-catalog';
import { FieldCatalogManager } from '@/features/field-catalog/components/field-catalog-manager';
import { PageHeader } from '@/shared/components/page-header';

type Props = { params: { locale: string } };

export default async function FieldCatalogPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminFieldCatalog');
  const result = await listFieldCatalog();

  return (
    <div className="p-8">
      <PageHeader title={t('title')} />
      {result.ok ? (
        <FieldCatalogManager initialGroups={result.data} />
      ) : (
        <p className="text-destructive text-sm">{t('loadError')}</p>
      )}
    </div>
  );
}
