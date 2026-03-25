'use client';

import { useState, type ReactNode } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { ShellConfig, ShellUser } from './types';
import { AppSidebar } from './app-sidebar';
import { AppHeader } from './app-header';

type AppShellProps = {
  config: ShellConfig;
  user: ShellUser;
  children: ReactNode;
};

export function AppShell({ config, user, children }: AppShellProps) {
  const responsive = config.responsive ?? false;
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar — always visible if not responsive, hidden on mobile if responsive */}
      <div className={responsive ? 'hidden lg:flex' : 'flex'}>
        <AppSidebar config={config} />
      </div>

      {/* Mobile sidebar via Sheet — only when responsive */}
      {responsive && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0" showCloseButton={false}>
            <AppSidebar
              config={config}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          user={user}
          responsive={responsive}
          onMobileMenuToggle={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
