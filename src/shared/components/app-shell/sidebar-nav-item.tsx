'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import { getNavIcon } from './icon-registry';
import type { NavItem } from './types';

type SidebarNavItemProps = {
  item: NavItem;
  isActive: boolean;
  translationNamespace: string;
  onClick?: () => void;
};

export function SidebarNavItem({
  item,
  isActive,
  translationNamespace,
  onClick,
}: SidebarNavItemProps) {
  const t = useTranslations(translationNamespace);
  const Icon = getNavIcon(item.icon);

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
      )}
    >
      <Icon className="size-5 shrink-0" />
      <span className="truncate">{t(item.labelKey)}</span>
      {item.badge != null && item.badge > 0 && (
        <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
