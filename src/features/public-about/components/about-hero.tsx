import { getTranslations } from 'next-intl/server';
import { Hero } from '@/shared/components/marketing/hero';

const HERO_IMAGE =
  'https://725e9d51ad7caf1033da4d1e65348273.cdn.bubble.io/f1741702520316x265816710776337820/column%202.svg';

export async function AboutHero() {
  const t = await getTranslations('about.hero');

  return (
    <Hero
      titleBefore={t('titleBefore')}
      titleAccent={t('titleAccent')}
      titleAfter={t('titleAfter')}
      lead={t('lead')}
      media={{ type: 'image', src: HERO_IMAGE, alt: t('imageAlt') }}
      background="sky"
      compact
      decorations={false}
    />
  );
}
