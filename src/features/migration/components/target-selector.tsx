'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { MIGRATION_TARGETS } from '../types';
import type { MigrationTarget } from '../types';

type Props = {
  onSelect: (target: MigrationTarget) => void;
};

const PREREQUISITES: Record<MigrationTarget, string> = {
  talents: 'services, countries, cities',
  clients: 'countries, cities',
  orders: 'services, clients, talents, cities',
};

export function TargetSelector({ onSelect }: Props) {
  const t = useTranslations('AdminMigration');

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">{t('selectTarget')}</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {MIGRATION_TARGETS.map((target) => (
          <button
            key={target}
            onClick={() => onSelect(target)}
            className="rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent"
          >
            <p className="font-medium">{t(target)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('prerequisite', { items: PREREQUISITES[target] })}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
