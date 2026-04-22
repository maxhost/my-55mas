import type { NavGroup, ShellConfig } from '@/shared/components/app-shell/types';

export const ADMIN_SIDEBAR_THEME = 'sidebar-admin';

export const adminNavGroups: NavGroup[] = [
  {
    labelKey: 'groupOperations',
    collapsible: true,
    defaultOpen: true,
    items: [
      { labelKey: 'orders', href: '/admin/orders', icon: 'clipboard-list' },
      { labelKey: 'archive', href: '/admin/archive', icon: 'archive' },
      { labelKey: 'payments', href: '/admin/payments', icon: 'credit-card' },
    ],
  },
  {
    labelKey: 'groupUsers',
    collapsible: true,
    defaultOpen: true,
    items: [
      { labelKey: 'talents', href: '/admin/talents', icon: 'users' },
      { labelKey: 'clients', href: '/admin/clients', icon: 'user-check' },
      { labelKey: 'spokenLanguages', href: '/admin/spoken-languages', icon: 'globe' },
    ],
  },
  {
    labelKey: 'groupStaff',
    collapsible: true,
    defaultOpen: true,
    items: [
      { labelKey: 'members', href: '/admin/members', icon: 'shield' },
      { labelKey: 'notifications', href: '/admin/notifications', icon: 'bell' },
    ],
  },
  {
    labelKey: 'groupCatalog',
    collapsible: true,
    defaultOpen: true,
    items: [
      { labelKey: 'services', href: '/admin/services', icon: 'briefcase' },
      { labelKey: 'subtypes', href: '/admin/subtypes', icon: 'tags' },
      { labelKey: 'talentTags', href: '/admin/talent-tags', icon: 'tags' },
      { labelKey: 'talentServices', href: '/admin/talent-services', icon: 'file-text' },
      { labelKey: 'fieldCatalog', href: '/admin/field-catalog', icon: 'database' },
    ],
  },
  {
    labelKey: 'groupForms',
    collapsible: true,
    defaultOpen: true,
    items: [
      { labelKey: 'forms', href: '/admin/forms', icon: 'file-text' },
    ],
  },
  {
    labelKey: 'groupStats',
    collapsible: true,
    defaultOpen: true,
    items: [
      { labelKey: 'dashboard', href: '/admin', icon: 'layout-dashboard' },
      { labelKey: 'surveyQuestions', href: '/admin/survey-questions', icon: 'bar-chart-2' },
    ],
  },
  {
    labelKey: 'groupSystem',
    collapsible: true,
    defaultOpen: false,
    items: [
      { labelKey: 'migration', href: '/admin/migration', icon: 'upload' },
    ],
  },
];

export function getAdminShellConfig(logo: ShellConfig['logo']): ShellConfig {
  return {
    logo,
    navGroups: adminNavGroups,
    themeClass: ADMIN_SIDEBAR_THEME,
    navTranslationNamespace: 'AdminNav',
    responsive: false,
  };
}
