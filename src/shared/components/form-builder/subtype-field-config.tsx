'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';

export type SubtypeGroupOption = {
  slug: string;
  name: string;
};

type Props = {
  subtypeGroups: SubtypeGroupOption[];
  selectedGroup?: string;
  onGroupChange: (slug: string) => void;
};

export function SubtypeFieldConfig({ subtypeGroups, selectedGroup, onGroupChange }: Props) {
  const t = useTranslations('AdminFormBuilder');

  if (subtypeGroups.length === 0) {
    return (
      <div className="bg-muted/50 ml-6 rounded-md p-3">
        <p className="text-muted-foreground text-xs">{t('subtypeFieldInfo')}</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/50 ml-6 space-y-1 rounded-md p-3">
      <Label className="text-xs">{t('subtypeGroup')}</Label>
      <select
        value={selectedGroup ?? ''}
        onChange={(e) => onGroupChange(e.target.value)}
        className="border-input bg-background h-7 w-48 rounded-md border px-2 text-xs"
      >
        <option value="">{t('selectGroup')}</option>
        {subtypeGroups.map((g) => (
          <option key={g.slug} value={g.slug}>
            {g.name || g.slug}
          </option>
        ))}
      </select>
    </div>
  );
}
