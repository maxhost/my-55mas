import type { ReactNode } from 'react';
import { unstable_setRequestLocale } from 'next-intl/server';
import { routing } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import type { ShellUser } from '@/shared/components/app-shell/types';
import { AdminShell } from './admin-shell';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

type Props = {
  children: ReactNode;
  params: { locale: string };
};

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = params;
  unstable_setRequestLocale(locale);

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let shellUser: ShellUser = {
    name: 'Admin',
    avatarUrl: null,
    initials: 'AD',
  };

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();

    if (profile?.full_name) {
      shellUser = {
        name: profile.full_name,
        avatarUrl: profile.avatar_url ?? null,
        initials: getInitials(profile.full_name),
      };
    }
  }

  return (
    <AdminShell user={shellUser}>
      {children}
    </AdminShell>
  );
}
