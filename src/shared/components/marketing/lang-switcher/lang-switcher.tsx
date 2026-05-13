'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/lib/i18n/navigation';
import { locales, type Locale } from '@/lib/i18n/config';

// Each locale renders its own native name. Idiomatic UX: a French user
// scanning the list sees "Français" regardless of currently-active locale.
const LANG_NAMES: Record<string, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
  fr: 'Français',
  ca: 'Català',
};

type Props = {
  /** dark = navy text on light background (header). light = white text on
   *  dark background (footer). */
  tone?: 'dark' | 'light';
  /** Where to anchor the dropdown horizontally. */
  align?: 'left' | 'right';
  /** Open upward when the trigger sits near the bottom of the viewport
   *  (e.g. the mobile drawer's footer). Defaults to 'down'. */
  placement?: 'down' | 'up';
};

export function LangSwitcher({ tone = 'dark', align = 'right', placement = 'down' }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click + ESC. Pointerdown (not click) so we close
  // before the next button's click event arrives.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSelect = (next: Locale) => {
    setOpen(false);
    if (next === locale) return;
    const search = searchParams?.toString() ?? '';
    const href = search ? `${pathname}?${search}` : pathname;
    // next-intl router preserves the same path but swaps the locale prefix.
    router.replace(href, { locale: next });
  };

  const triggerText = tone === 'light' ? 'text-white' : 'text-brand-text';
  const panelAlign = align === 'right' ? 'right-0' : 'left-0';
  const panelVertical =
    placement === 'up' ? 'bottom-full mb-2' : 'top-full mt-2';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 text-sm ${triggerText}`}
      >
        <span aria-hidden="true">🌐</span>
        {LANG_NAMES[locale]}
        <span aria-hidden="true" className="text-[0.65rem]">▾</span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Cambiar idioma"
          className={`
            absolute z-50 ${panelVertical} ${panelAlign}
            min-w-[160px] rounded-lg border border-black/10
            bg-white py-1 shadow-lg
          `}
        >
          {locales.map((l) => {
            const isActive = l === locale;
            return (
              <li key={l}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelect(l)}
                  className={`
                    block w-full px-4 py-2 text-left text-sm text-brand-text
                    hover:bg-brand-cream transition-colors
                    ${isActive ? 'font-bold' : ''}
                  `}
                >
                  {LANG_NAMES[l]}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
