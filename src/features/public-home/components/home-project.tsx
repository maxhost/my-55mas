import { getTranslations } from 'next-intl/server';
import { ProjectSection } from '@/shared/components/marketing/project';

// External RTVE Play page for the reportage that backs the hero image.
const RTVE_URL = 'https://www.rtve.es/play/videos/para-todos-la-2/personas-mas-55/16163213/';
const PROJECT_IMAGE =
  'https://725e9d51ad7caf1033da4d1e65348273.cdn.bubble.io/cdn-cgi/image/w=768,h=529,f=auto,dpr=2,fit=contain/f1745528846068x685064865993180800/image.png';

export async function HomeProject() {
  const t = await getTranslations('home.project');

  return (
    <ProjectSection
      imageSrc={PROJECT_IMAGE}
      imageAlt={t('imageAlt')}
      imageWidth={768}
      imageHeight={529}
      imageHref={RTVE_URL}
      imageOpensInNewTab
      title={t('title')}
      lead={t('lead')}
      cta={{ label: t('cta'), href: '/sobre-55' }}
    />
  );
}
