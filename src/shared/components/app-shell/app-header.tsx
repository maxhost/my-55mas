'use client';

import { useTranslations } from 'next-intl';
import { LogOut, Menu } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/shared/actions/logout';
import type { ShellUser } from './types';

type AppHeaderProps = {
  user: ShellUser;
  responsive?: boolean;
  onMobileMenuToggle?: () => void;
};

export function AppHeader({
  user,
  responsive = false,
  onMobileMenuToggle,
}: AppHeaderProps) {
  const t = useTranslations('Common');

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-3">
        {responsive && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMobileMenuToggle}
          >
            <Menu className="size-5" />
            <span className="sr-only">Menu</span>
          </Button>
        )}
      </div>

      {/* User menu */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          {user.name}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar size="default">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
              <AvatarFallback>{user.initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" sideOffset={8}>
            <DropdownMenuItem
              onClick={() => logoutAction()}
            >
              <LogOut className="size-4" />
              {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
