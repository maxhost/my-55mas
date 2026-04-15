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
  /** Clave i18n del título del grupo (si hay, muestra header colapsable) */
  labelKey?: string;
  /** Si true, el grupo se puede colapsar. Default: false */
  collapsible?: boolean;
  /** Estado inicial del grupo. Default: true (expandido) */
  defaultOpen?: boolean;
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
