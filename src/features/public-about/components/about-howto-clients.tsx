import { getTranslations } from 'next-intl/server';
import { HowItWorks } from '@/shared/components/marketing/howto';

// Mirrors HomeHowtoClients exactly: same local SVG, same dimensions,
// same shape variant, same CTA target. The /sobre-55 copy still comes
// from its own about.howtoClients namespace.
export async function AboutHowtoClients() {
  const t = await getTranslations('about.howtoClients');

  return (
    <HowItWorks
      reversed
      withCreamBg
      imageSrc="/brand/howto-clients-image.svg"
      imageAlt={t('imageAlt')}
      imageWidth={500}
      imageHeight={300}
      shapeVariant="clients"
      heading={t('heading')}
      steps={[
        { num: 1, label: t('steps.s1') },
        { num: 2, label: t('steps.s2') },
        { num: 3, label: t('steps.s3') },
      ]}
      cta={{ label: t('cta'), href: '/contratar', variant: 'mustard' }}
    />
  );
}
