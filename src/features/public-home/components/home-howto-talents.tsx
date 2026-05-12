import { getTranslations } from 'next-intl/server';
import { HowItWorks } from '@/shared/components/marketing/howto';

export async function HomeHowtoTalents() {
  const t = await getTranslations('home.howtoTalents');

  return (
    <HowItWorks
      sectionTitle={t('sectionTitle')}
      sectionTitleAccent={t('sectionTitleAccent')}
      imageSrc="/brand/howto-image.svg"
      imageAlt={t('imageAlt')}
      imageWidth={500}
      imageHeight={300}
      shapeVariant="talents"
      heading={t('heading')}
      steps={[
        { num: 1, label: t('steps.s1') },
        { num: 2, label: t('steps.s2') },
        { num: 3, label: t('steps.s3') },
      ]}
      cta={{ label: t('cta'), href: '/registro/talento', variant: 'mustard' }}
    />
  );
}
