import type { ReactNode } from 'react';

export type NavItem = {
  labelKey: string;
  href: string;
  /** String key que se resuelve a un LucideIcon via icon-registry (client-side) */
  icon: string;
  badge?: number;
};

export type NavGroup = {
  items: NavItem[];
};

export type ShellConfig = {
  logo: ReactNode;
  navGroups: NavGroup[];
  themeClass: string;
  /** Namespace de i18n para los labels del sidebar */
  navTranslationNamespace: string;
  /** Si true, sidebar colapsable en mobile con Sheet. Default: false */
  responsive?: boolean;
};

export type ShellUser = {
  name: string;
  avatarUrl: string | null;
  initials: string;
};
