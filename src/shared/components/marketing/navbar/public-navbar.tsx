import { getTranslations } from 'next-intl/server';
import { NavLink, type NavKey } from './nav-link';

type NavItem = { key: NavKey; href: string };

const ITEMS: ReadonlyArray<NavItem> = [
  { key: 'home', href: '/' },
  { key: 'services', href: '/servicios' },
  { key: 'offer', href: '/ofrece' },
  { key: 'about', href: '/sobre-55' },
];

// Red strip nav under the header. Items are pulled from nav.* i18n keys.
// Active underline is derived from the current pathname inside <NavLink>
// (a small Client Component) so the rest of the nav stays an RSC.
export async function PublicNavbar() {
  const t = await getTranslations('nav');

  return (
    <nav
      aria-label={t('mainAria')}
      className="hidden bg-brand-red text-white lg:block"
    >
      <div className="mx-auto max-w-[1200px] flex flex-wrap justify-center gap-x-9 gap-y-1 px-4 py-1.5">
        {ITEMS.map((item) => (
          <NavLink
            key={item.key}
            navKey={item.key}
            href={item.href}
            label={t(item.key)}
          />
        ))}
      </div>
    </nav>
  );
}
