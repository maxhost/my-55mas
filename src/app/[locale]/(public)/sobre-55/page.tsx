import { unstable_setRequestLocale } from 'next-intl/server';
import { buildPublicMetadata } from '@/shared/lib/seo';
import { AboutHero } from '@/features/public-about/components/about-hero';
import { AboutProtagonists } from '@/features/public-about/components/about-protagonists';
import { AboutMovement } from '@/features/public-about/components/about-movement';
import { AboutHowtoTalents } from '@/features/public-about/components/about-howto-talents';
import { AboutHowtoClients } from '@/features/public-about/components/about-howto-clients';

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props) {
  return buildPublicMetadata({
    locale,
    namespace: 'about.meta',
    path: '/sobre-55',
  });
}

export default async function AboutPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);

  return (
    <>
      <AboutHero />
      <AboutProtagonists />
      <AboutMovement />
      <AboutHowtoTalents />
      <AboutHowtoClients />
    </>
  );
}
