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
  BarChart2,
  Tags,
  Upload,
  ChevronDown,
  Circle,
  Globe,
  Database,
  IdCard,
  Star,
  HelpCircle,
  Scroll,
  Lock,
  FileCheck,
  ShieldCheck,
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
  'bar-chart-2': BarChart2,
  tags: Tags,
  upload: Upload,
  'chevron-down': ChevronDown,
  globe: Globe,
  database: Database,
  'id-card': IdCard,
  star: Star,
  'help-circle': HelpCircle,
  scroll: Scroll,
  lock: Lock,
  'file-check': FileCheck,
  'shield-check': ShieldCheck,
};

export function getNavIcon(name: string): LucideIcon {
  return icons[name] ?? Circle;
}
