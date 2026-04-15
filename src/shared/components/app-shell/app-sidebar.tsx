'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from '@/lib/i18n/navigation';
import { ChevronDown } from 'lucide-react';
import type { NavGroup, ShellConfig } from './types';
import { SidebarNavItem } from './sidebar-nav-item';

type AppSidebarProps = {
  config: ShellConfig;
  onNavigate?: () => void;
};

const STORAGE_KEY = 'admin-nav-open';

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname.startsWith(href);
}

function buildDefaults(groups: NavGroup[]): Record<string, boolean> {
  const state: Record<string, boolean> = {};
  for (const g of groups) {
    if (g.collapsible && g.labelKey) state[g.labelKey] = g.defaultOpen ?? true;
  }
  return state;
}

export function AppSidebar({ config, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations(config.navTranslationNamespace);
  const [openState, setOpenState] = useState(() => buildDefaults(config.navGroups));

  // Post-mount: merge localStorage + auto-expand active group
  useEffect(() => {
    let stored: Record<string, boolean> = {};
    try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); } catch { /* noop */ }

    setOpenState(() => {
      const next = buildDefaults(config.navGroups);
      for (const g of config.navGroups) {
        if (!g.collapsible || !g.labelKey) continue;
        const hasActive = g.items.some((item) => isActiveRoute(pathname, item.href));
        next[g.labelKey] = hasActive ? true : (stored[g.labelKey] ?? (g.defaultOpen ?? true));
      }
      return next;
    });
  }, [pathname, config.navGroups]);

  const toggleGroup = (labelKey: string) => {
    setOpenState((prev) => {
      const next = { ...prev, [labelKey]: !prev[labelKey] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  };

  return (
    <aside
      className={`${config.themeClass} flex h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground`}
    >
      <div className="flex h-16 items-center px-5">{config.logo}</div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
        {config.navGroups.map((group, i) => (
          <CollapsibleGroup
            key={group.labelKey ?? i}
            group={group}
            isOpen={group.labelKey ? (openState[group.labelKey] ?? true) : true}
            onToggle={group.labelKey ? () => toggleGroup(group.labelKey!) : undefined}
            label={group.labelKey ? t(group.labelKey) : undefined}
            pathname={pathname}
            translationNamespace={config.navTranslationNamespace}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </aside>
  );
}

type CollapsibleGroupProps = {
  group: NavGroup;
  isOpen: boolean;
  onToggle?: () => void;
  label?: string;
  pathname: string;
  translationNamespace: string;
  onNavigate?: () => void;
};

function CollapsibleGroup({
  group,
  isOpen,
  onToggle,
  label,
  pathname,
  translationNamespace,
  onNavigate,
}: CollapsibleGroupProps) {
  const showHeader = group.collapsible && label;

  return (
    <div className="mb-1">
      {showHeader && (
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60 hover:text-sidebar-foreground/80"
        >
          {label}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
          />
        </button>
      )}

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                isActive={isActiveRoute(pathname, item.href)}
                translationNamespace={translationNamespace}
                onClick={onNavigate}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
