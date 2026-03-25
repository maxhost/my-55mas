'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { Input } from '@/components/ui/input';
import { buttonVariants } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
};

export function ServicesToolbar({ search, onSearchChange }: Props) {
  const t = useTranslations('AdminServices');

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="relative max-w-sm flex-1">
        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Link
        href="/admin/services/new"
        className={buttonVariants({ variant: 'default' })}
      >
        <Plus className="mr-2 h-4 w-4" />
        {t('createService')}
      </Link>
    </div>
  );
}
