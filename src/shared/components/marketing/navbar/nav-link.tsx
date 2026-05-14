'use client';

import { Link } from '@/lib/i18n/navigation';
import { usePathname } from 'next/navigation';
import { stripLocale } from '@/shared/lib/i18n/strip-locale';

export type NavKey = 'home' | 'services' | 'offer' | 'about';

type Props = {
  navKey: NavKey;
  href: string;
  label: string;
};

const ACTIVE_MATCHERS: Record<NavKey, (path: string) => boolean> = {
  home: (p) => p === '/' || p === '',
  services: (p) => p === '/servicios' || p.startsWith('/servicios/'),
  offer:
    (p) =>
      p === '/ofrece'
      || p === '/registro/talento'
      || p.startsWith('/registro/talento/'),
  about: (p) => p === '/sobre-55' || p.startsWith('/sobre-55/'),
};

// Client-side nav link with pathname-derived active underline. Server can't
// read the current pathname from next-intl's middleware response, so we
// delegate just the active check here; the label still comes from RSC i18n.
export function NavLink({ navKey, href, label }: Props) {
  const pathname = usePathname();
  const stripped = stripLocale(pathname);
  const isActive = ACTIVE_MATCHERS[navKey](stripped);

  return (
    <Link
      href={href}
      className={`
        relative py-0.5 text-[0.92rem] font-semibold text-white
        hover:opacity-85 transition-opacity
        ${isActive ? 'after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:bg-white after:rounded-sm' : ''}
      `}
    >
      {label}
    </Link>
  );
}
