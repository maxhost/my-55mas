'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';

type Props = { error: Error & { digest?: string }; reset: () => void };

// Public-section error boundary. Renders a styled fallback when an RSC
// throws. Logs to console for now; fase parqueada plug Sentry/etc here.
export default function PublicError({ error, reset }: Props) {
  const t = useTranslations('errors.boundary');

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[public error boundary]', error);
  }, [error]);

  return (
    <section className="bg-brand-cream px-4 py-24 text-center">
      <div className="mx-auto max-w-[640px]">
        <h1 className="m-0 mb-3 text-3xl font-bold text-brand-text md:text-4xl">{t('title')}</h1>
        <p className="m-0 mb-7 text-brand-text/75">{t('lead')}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-full bg-brand-mustard px-7 py-3 text-base font-semibold text-brand-text hover:bg-brand-mustard-deep transition-colors"
          >
            {t('retry')}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border-2 border-brand-text bg-white px-7 py-3 text-base font-semibold text-brand-text hover:bg-brand-text hover:text-white transition-colors"
          >
            {t('home')}
          </Link>
        </div>
      </div>
    </section>
  );
}
