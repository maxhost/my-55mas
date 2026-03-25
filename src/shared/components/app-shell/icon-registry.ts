'use client';

import type { LucideIcon } from 'lucide-react';
import {
  ClipboardList,
  Archive,
  Users,
  UserCheck,
  Shield,
  LayoutDashboard,
  FileText,
  CreditCard,
  Bell,
  Briefcase,
  Circle,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  'clipboard-list': ClipboardList,
  archive: Archive,
  users: Users,
  'user-check': UserCheck,
  shield: Shield,
  'layout-dashboard': LayoutDashboard,
  'file-text': FileText,
  'credit-card': CreditCard,
  bell: Bell,
  briefcase: Briefcase,
};

export function getNavIcon(name: string): LucideIcon {
  return icons[name] ?? Circle;
}
