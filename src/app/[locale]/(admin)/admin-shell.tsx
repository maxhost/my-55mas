'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/shared/components/app-shell';
import { getAdminShellConfig } from '@/shared/config/admin-nav';
import { BrandLogo } from '@/shared/components/brand-logo';
import type { ShellUser } from '@/shared/components/app-shell/types';

type AdminShellProps = {
  user: ShellUser;
  children: ReactNode;
};

const logo = <BrandLogo />;

const config = getAdminShellConfig(logo);

export function AdminShell({ user, children }: AdminShellProps) {
  return (
    <AppShell config={config} user={user}>
      {children}
    </AppShell>
  );
}
