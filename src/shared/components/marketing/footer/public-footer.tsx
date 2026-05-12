import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { SITE_CONFIG } from '@/shared/lib/site-config';
import { SocialsRow } from '../header/socials-row';
import { FooterColorStripe } from './footer-color-stripe';

type FooterLink = { key: string; href: string; label: string };

// Public footer (RSC). Navy background, 3-column layout, color stripe.
export async function PublicFooter() {
  const t = await getTranslations('footer');
  const tNav = await getTranslations('nav');

  const navLinks: FooterLink[] = [
    { key: 'home', href: '/', label: tNav('home') },
    { key: 'services', href: '/servicios', label: tNav('services') },
    { key: 'about', href: '/sobre-55', label: tNav('about') },
    { key: 'offer', href: '/ofrece', label: tNav('offer') },
  ];

  const legalLinks: FooterLink[] = [
    { key: 'faq', href: '/preguntas-frecuentes', label: t('legal.faq') },
    { key: 'terms-site', href: '/condiciones-sitio', label: t('legal.siteTerms') },
    { key: 'privacy', href: '/privacidad', label: t('legal.privacy') },
    { key: 'terms-service', href: '/terminos-servicio', label: t('legal.serviceTerms') },
    { key: 'transparency', href: '/transparencia', label: t('legal.transparency') },
  ];

  return (
    <footer className="bg-brand-text text-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-12 pb-8 md:px-6">
        {/* Top row: brand + lang */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" aria-label={tNav('homeAria')}>
            <Image
              src="/brand/logo-light.svg"
              alt={SITE_CONFIG.brandName}
              width={120}
              height={52}
              className="h-13 w-auto block"
            />
          </Link>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm text-white"
            aria-haspopup="listbox"
          >
            <span aria-hidden="true">🌐</span>
            {tNav('lang')}
          </button>
        </div>

        {/* 3-column grid */}
        <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-[1.3fr_1fr_1.2fr] md:gap-15">
          <div className="flex flex-col gap-3.5 text-[0.92rem] text-white/90">
            <p className="m-0 leading-relaxed">
              <a href={`tel:${SITE_CONFIG.phone}`} className="hover:text-brand-mustard">
                {SITE_CONFIG.phoneDisplay}
              </a>
              <br />
              <a href={`mailto:${SITE_CONFIG.email}`} className="hover:text-brand-mustard">
                {SITE_CONFIG.email}
              </a>
            </p>
            {SITE_CONFIG.offices.map((office) => (
              <p key={office.key} className="m-0 text-white/75 leading-snug">
                <strong className="text-white font-bold block mb-0.5">{office.cityLabel}</strong>
                {office.address}
              </p>
            ))}
          </div>

          <ul className="flex flex-col gap-3 text-[0.92rem]">
            {navLinks.map((link) => (
              <li key={link.key}>
                <Link href={link.href} className="text-white underline underline-offset-[3px] hover:text-brand-mustard">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="flex flex-col gap-3 text-[0.92rem]">
            {legalLinks.map((link) => (
              <li key={link.key}>
                <Link href={link.href} className="text-white underline underline-offset-[3px] hover:text-brand-mustard">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: copyright + socials */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <div className="text-xs text-white/65">
            © {SITE_CONFIG.copyrightYear} {SITE_CONFIG.brandName}
          </div>
          <SocialsRow tone="light" size={20} ariaLabel={t('socialsAria')} />
        </div>
      </div>

      <FooterColorStripe />
    </footer>
  );
}
