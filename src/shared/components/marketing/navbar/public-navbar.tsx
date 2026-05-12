import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

type NavItem = { key: 'home' | 'services' | 'offer' | 'about'; href: string };

const ITEMS: ReadonlyArray<NavItem> = [
  { key: 'home', href: '/' },
  { key: 'services', href: '/servicios' },
  { key: 'offer', href: '/ofrece' },
  { key: 'about', href: '/sobre-55' },
];

type Props = {
  activeKey?: NavItem['key'];
};

// Red strip nav under the header. Items are pulled from nav.* i18n keys.
// Active item gets a white underline.
export async function PublicNavbar({ activeKey = 'home' }: Props) {
  const t = await getTranslations('nav');

  return (
    <nav aria-label={t('mainAria')} className="bg-brand-red text-white">
      <div className="mx-auto max-w-[1200px] flex flex-wrap justify-center gap-x-9 gap-y-1 px-4 py-1.5">
        {ITEMS.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`
                relative py-0.5 text-[0.92rem] font-semibold text-white
                hover:opacity-85 transition-opacity
                ${isActive ? "after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:bg-white after:rounded-sm" : ''}
              `}
            >
              {t(item.key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
