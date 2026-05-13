import { getTranslations } from 'next-intl/server';
import { FeatureRow } from '@/shared/components/marketing/feature-row';

// Same unlisted Vimeo embed as the home hero — Elena Parras presentation.
const VIMEO_ID = '1065114208';
const VIMEO_HASH = '6808bfbada';
const VIMEO_SRC = `https://player.vimeo.com/video/${VIMEO_ID}?h=${VIMEO_HASH}&title=0&byline=0&portrait=0`;

export async function AboutMovement() {
  const t = await getTranslations('about.movement');

  return (
    <FeatureRow
      title={t('title')}
      lead={t('lead')}
      media={{ type: 'video', src: VIMEO_SRC, title: t('videoTitle') }}
      cta={{ label: t('cta'), href: '/registro/talento', variant: 'mustard' }}
    />
  );
}
