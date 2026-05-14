import { Link } from '@/lib/i18n/navigation';
import { getTranslations } from 'next-intl/server';

// Public 404. Triggered when a public route doesn't resolve (e.g. a
// /servicios/<slug> that doesn't exist once fase 4 adds dynamic routes).
export default async function PublicNotFound() {
  const t = await getTranslations('errors.notFound');
  return (
    <section className="bg-brand-cream px-4 py-24 text-center">
      <div className="mx-auto max-w-[640px]">
        <p className="m-0 mb-3 text-7xl font-bold text-brand-coral">404</p>
        <h1 className="m-0 mb-3 text-3xl font-bold text-brand-text md:text-4xl">{t('title')}</h1>
        <p className="m-0 mb-7 text-brand-text/75">{t('lead')}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-brand-mustard px-7 py-3 text-base font-semibold text-brand-text hover:bg-brand-mustard-deep transition-colors"
        >
          {t('home')}
        </Link>
      </div>
    </section>
  );
}
