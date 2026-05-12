import { getTranslations } from 'next-intl/server';
import { JoinCta } from '@/shared/components/marketing/join-cta';

export async function HomeJoinCta() {
  const t = await getTranslations('home.joinCta');

  return (
    <JoinCta
      title={t('title')}
      buttons={[
        { label: t('ctaPrimary'), href: '/contratar', variant: 'mustard' },
        { label: t('ctaSecondary'), href: '/registro/talento', variant: 'outlined' },
      ]}
    />
  );
}
