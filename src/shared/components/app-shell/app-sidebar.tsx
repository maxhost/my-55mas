'use client';

import { usePathname } from '@/lib/i18n/navigation';
import { Separator } from '@/components/ui/separator';
import type { ShellConfig } from './types';
import { SidebarNavItem } from './sidebar-nav-item';

type AppSidebarProps = {
  config: ShellConfig;
  onNavigate?: () => void;
};

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname.startsWith(href);
}

export function AppSidebar({ config, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`${config.themeClass} flex h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-5">
        {config.logo}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
        {config.navGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {groupIndex > 0 && (
              <Separator className="my-3 bg-sidebar-border" />
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  item={item}
                  isActive={isActiveRoute(pathname, item.href)}
                  translationNamespace={config.navTranslationNamespace}
                  onClick={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
