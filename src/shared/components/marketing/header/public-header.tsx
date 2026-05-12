import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LOCATOR_CITIES, type LocatorCity } from '@/shared/lib/country';
import { MobileMenu } from '../mobile-menu';
import { SocialsRow } from './socials-row';
import { LocatorSelect } from './locator-select';

type Props = {
  currentCity: LocatorCity;
};

// Public header (RSC). Sticky white bar with logo + city locator + socials
// + lang switcher + Iniciar sesión. The locator-select is a Client island;
// everything else is server-rendered (zero JS shipped).
export async function PublicHeader({ currentCity }: Props) {
  const t = await getTranslations('nav');

  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="mx-auto max-w-[1200px] flex items-center gap-4 px-4 py-3.5 lg:gap-6 lg:px-6 lg:py-4">
        <Link href="/" aria-label={t('homeAria')} className="flex-shrink-0">
          <Image
            src="/brand/logo.svg"
            alt="55+"
            width={120}
            height={45}
            priority
            className="h-10 w-auto block"
          />
        </Link>

        {/* Locator — hidden on mobile (burger menu surfaces it later in fase 1.1+) */}
        <div className="hidden lg:flex flex-col gap-1 flex-1 max-w-[460px]">
          <label htmlFor="loc-select" className="text-sm font-medium text-brand-text whitespace-nowrap">
            {t('chooseLocation')}
          </label>
          <LocatorSelect
            cities={LOCATOR_CITIES}
            currentSlug={currentCity.slug}
            searchLabel={t('search')}
            searchAriaLabel={t('searchAria')}
          />
        </div>

        <div className="hidden lg:flex items-center gap-4 ml-auto">
          <SocialsRow tone="dark" ariaLabel={t('socialsAria')} />
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-brand-text"
            aria-haspopup="listbox"
          >
            <span aria-hidden="true">🌐</span>
            {t('lang')}
          </button>
          <Link
            href="/login"
            className="
              inline-flex items-center justify-center
              bg-brand-mustard text-brand-text
              rounded-full px-5 py-2.5
              text-sm font-bold
              hover:bg-brand-mustard-deep
              transition-colors
            "
          >
            {t('signIn')}
          </Link>
        </div>

        <MobileMenu
          ariaLabelOpen={t('menuAria')}
          ariaLabelClose={t('menuCloseAria')}
          brandAlt={t('homeAria')}
          socialsAriaLabel={t('socialsAria')}
          signInLabel={t('signIn')}
          signInHref="/login"
          langLabel={t('lang')}
          links={[
            { key: 'home', href: '/', label: t('home') },
            { key: 'services', href: '/servicios', label: t('services') },
            { key: 'offer', href: '/ofrece', label: t('offer') },
            { key: 'about', href: '/sobre-55', label: t('about') },
          ]}
        />
      </div>
    </header>
  );
}
