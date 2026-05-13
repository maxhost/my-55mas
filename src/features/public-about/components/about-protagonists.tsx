import { getTranslations } from 'next-intl/server';
import { FeatureRow } from '@/shared/components/marketing/feature-row';

const PROTAGONISTS_IMAGE =
  'https://725e9d51ad7caf1033da4d1e65348273.cdn.bubble.io/f1741702669736x357165747797995900/Background%20copy%202.svg';

export async function AboutProtagonists() {
  const t = await getTranslations('about.protagonists');

  return (
    <FeatureRow
      title={t('title')}
      lead={t('lead')}
      media={{
        type: 'image',
        src: PROTAGONISTS_IMAGE,
        alt: t('imageAlt'),
        width: 600,
        height: 500,
      }}
      shapeVariant="about"
    />
  );
}
