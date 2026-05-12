import { getTranslations } from 'next-intl/server';
import { Hero } from '@/shared/components/marketing/hero';

// Vimeo hash is unlisted-style — the video is private/unlisted and the
// hash grants embed permission. Source: https://vimeo.com/1065114208
const VIMEO_ID = '1065114208';
const VIMEO_HASH = '6808bfbada';
const VIMEO_SRC = `https://player.vimeo.com/video/${VIMEO_ID}?h=${VIMEO_HASH}&title=0&byline=0&portrait=0`;

// Home-specific hero assembly: pulls copy from home.hero.* i18n and the
// Vimeo video constant above, then hands everything to the agnostic Hero.
export async function HomeHero() {
  const t = await getTranslations('home.hero');

  return (
    <Hero
      titleBefore={t('titleBefore')}
      titleAccent={t('titleAccent')}
      titleAfter={t('titleAfter')}
      lead={t('lead')}
      ctas={[
        {
          id: 'clients',
          prefix: t('ctaClientsLabel'),
          buttonLabel: t('ctaClientsButton'),
          href: '/contratar',
          variant: 'mustard',
        },
        {
          id: 'talents',
          prefix: t('ctaTalentsLabel'),
          buttonLabel: t('ctaTalentsButton'),
          href: '/registro/talento',
          variant: 'outlined',
        },
      ]}
      media={{
        type: 'video',
        src: VIMEO_SRC,
        title: t('videoTitle'),
      }}
    />
  );
}
