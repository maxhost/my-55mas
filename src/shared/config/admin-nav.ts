import type { NavGroup, ShellConfig } from '@/shared/components/app-shell/types';

export const ADMIN_SIDEBAR_THEME = 'sidebar-admin';

export const adminNavGroups: NavGroup[] = [
  {
    items: [
      { labelKey: 'orders', href: '/admin/orders', icon: 'clipboard-list' },
      { labelKey: 'archive', href: '/admin/archive', icon: 'archive' },
      { labelKey: 'talents', href: '/admin/talents', icon: 'users' },
    ],
  },
  {
    items: [
      { labelKey: 'clients', href: '/admin/clients', icon: 'user-check' },
      { labelKey: 'members', href: '/admin/members', icon: 'shield' },
      { labelKey: 'services', href: '/admin/services', icon: 'briefcase' },
    ],
  },
  {
    items: [
      { labelKey: 'dashboard', href: '/admin', icon: 'layout-dashboard' },
      { labelKey: 'talentServices', href: '/admin/talent-services', icon: 'file-text' },
      { labelKey: 'forms', href: '/admin/forms', icon: 'file-text' },
      { labelKey: 'surveyQuestions', href: '/admin/survey-questions', icon: 'bar-chart-2' },
      { labelKey: 'payments', href: '/admin/payments', icon: 'credit-card' },
      { labelKey: 'notifications', href: '/admin/notifications', icon: 'bell' },
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
