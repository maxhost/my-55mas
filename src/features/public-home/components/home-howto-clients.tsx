import { getTranslations } from 'next-intl/server';
import { HowItWorks } from '@/shared/components/marketing/howto';

export async function HomeHowtoClients() {
  const t = await getTranslations('home.howtoClients');

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
