'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { stripLocale } from '@/shared/lib/i18n/strip-locale';

export type LegalSidebarItem = {
  key: string;
  href: string;
  label: string;
};

type Props = {
  items: LegalSidebarItem[];
  ariaLabel: string;
};

// Vertical sidebar for legal pages. Active item is highlighted via
// `usePathname()` (client-side); pattern mirrors `NavLink`.
export function LegalSidebar({ items, ariaLabel }: Props) {
  const pathname = usePathname();
  const current = stripLocale(pathname);

  return (
    <nav aria-label={ariaLabel}>
      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          const isActive = current === item.href;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  block py-1 text-[0.95rem] transition-colors
                  ${
                    isActive
                      ? 'text-brand-red font-semibold'
                      : 'text-brand-text hover:text-brand-red'
                  }
                `}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
