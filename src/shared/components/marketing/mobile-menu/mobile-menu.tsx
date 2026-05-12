'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SocialsRow } from '../header/socials-row';

export type MobileMenuLink = { key: string; href: string; label: string };

type Props = {
  ariaLabelOpen: string;
  ariaLabelClose: string;
  links: MobileMenuLink[];
  socialsAriaLabel: string;
  signInLabel: string;
  signInHref: string;
  langLabel: string;
  brandAlt: string;
};

// Client island that owns the burger trigger AND the fullscreen panel.
// The burger sits inside the header; clicking it opens a viewport-
// covering overlay with the nav + close button. ESC + scroll lock +
// initial focus on the close button.
export function MobileMenu({
  ariaLabelOpen,
  ariaLabelClose,
  links,
  socialsAriaLabel,
  signInLabel,
  signInHref,
  langLabel,
  brandAlt,
}: Props) {
  const [open, setOpen] = useState(false);

  // ESC to close + body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={ariaLabelOpen}
        aria-expanded={open}
        aria-controls="mobile-menu-panel"
        className="ml-auto flex flex-col gap-1 w-7 h-6 justify-between lg:hidden"
      >
        <span className="block h-0.5 w-full rounded-sm bg-brand-text" />
        <span className="block h-0.5 w-full rounded-sm bg-brand-text" />
        <span className="block h-0.5 w-full rounded-sm bg-brand-text" />
      </button>

      {open && (
        <div
          id="mobile-menu-panel"
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabelOpen}
          className="fixed inset-0 z-[200] flex flex-col bg-white lg:hidden"
        >
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-black/5">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              aria-label={brandAlt}
              className="flex-shrink-0"
            >
              <Image
                src="/brand/logo.svg"
                alt={brandAlt}
                width={120}
                height={45}
                priority
                className="h-10 w-auto block"
              />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={ariaLabelClose}
              autoFocus
              className="
                inline-flex h-10 w-10 items-center justify-center
                rounded-full text-brand-text hover:bg-brand-cream
                focus:outline-none focus-visible:outline focus-visible:outline-2
                focus-visible:outline-offset-2 focus-visible:outline-brand-text
              "
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>

          <nav aria-label={ariaLabelOpen} className="flex-1 overflow-y-auto px-4 py-8">
            <ul className="flex flex-col gap-2">
              {links.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="
                      block rounded-xl px-4 py-4 text-xl font-semibold text-brand-text
                      hover:bg-brand-cream transition-colors
                    "
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-black/5 px-4 py-5">
            <Link
              href={signInHref}
              onClick={() => setOpen(false)}
              className="
                mb-4 flex items-center justify-center
                rounded-full bg-brand-mustard px-5 py-3 text-base font-bold text-brand-text
                hover:bg-brand-mustard-deep transition-colors
              "
            >
              {signInLabel}
            </Link>
            <div className="flex items-center justify-between gap-4">
              <SocialsRow tone="dark" size={20} ariaLabel={socialsAriaLabel} />
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-sm text-brand-text"
                aria-haspopup="listbox"
              >
                <span aria-hidden="true">🌐</span>
                {langLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
