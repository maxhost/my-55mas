'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
};

export function ServicesToolbar({ search, onSearchChange }: Props) {
  const t = useTranslations('AdminServices');

  return (
    <div className="relative max-w-sm">
      <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
      <Input
        placeholder={t('searchPlaceholder')}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
