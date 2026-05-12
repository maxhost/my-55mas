'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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

// Client island that owns the burger trigger AND the fullscreen drawer.
// The drawer renders via createPortal to document.body so it escapes the
// header's sticky stacking context (otherwise the WhatsApp FAB at the
// layout root would float ON TOP of the drawer).
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
  const [mounted, setMounted] = useState(false);

  // Portal target only exists after mount; SSR safety.
  useEffect(() => setMounted(true), []);

  // ESC closes + scroll lock while open. Locking BOTH <html> and <body>
  // because iOS Safari ignores body-only overflow:hidden in some cases.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const drawer = (
    <div
      id="mobile-menu-panel"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabelOpen}
      className="fixed inset-0 z-[300] flex h-[100dvh] flex-col bg-white lg:hidden"
    >
      <div className="flex items-center justify-between border-b border-black/5 px-5 py-3">
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
            className="block h-9 w-auto"
          />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={ariaLabelClose}
          autoFocus
          className="
            -mr-2 inline-flex h-11 w-11 items-center justify-center
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

      <nav aria-label={ariaLabelOpen} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <ul className="flex flex-col gap-1.5">
          {links.map((link) => (
            <li key={link.key}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className="
                  block rounded-xl px-4 py-3.5 text-lg font-semibold text-brand-text
                  hover:bg-brand-cream transition-colors
                "
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href={signInHref}
          onClick={() => setOpen(false)}
          className="
            mt-6 flex items-center justify-center
            rounded-full bg-brand-mustard px-5 py-3 text-base font-bold text-brand-text
            hover:bg-brand-mustard-deep transition-colors
          "
        >
          {signInLabel}
        </Link>
      </nav>

      <div className="flex items-center justify-between gap-4 border-t border-black/5 px-5 py-3">
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
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={ariaLabelOpen}
        aria-expanded={open}
        aria-controls="mobile-menu-panel"
        className="ml-auto flex h-6 w-7 flex-col justify-between lg:hidden"
      >
        <span className="block h-0.5 w-full rounded-sm bg-brand-text" />
        <span className="block h-0.5 w-full rounded-sm bg-brand-text" />
        <span className="block h-0.5 w-full rounded-sm bg-brand-text" />
      </button>

      {open && mounted ? createPortal(drawer, document.body) : null}
    </>
  );
}
