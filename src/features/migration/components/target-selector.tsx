'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MIGRATION_TARGETS, CSV_LOCALES } from '../types';
import type { MigrationTarget, CsvLocale } from '../types';

type Props = {
  onSelect: (target: MigrationTarget, csvLocale: CsvLocale) => void;
};

const PREREQUISITES: Record<MigrationTarget, string> = {
  talents: 'services, countries, cities',
  clients: 'countries, cities',
  orders: 'services, clients, talents, cities',
};

const LOCALE_LABELS: Record<CsvLocale, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
  fr: 'Français',
  ca: 'Català',
};

export function TargetSelector({ onSelect }: Props) {
  const t = useTranslations('AdminMigration');
  const [selectedTarget, setSelectedTarget] = useState<MigrationTarget | null>(null);
  const [csvLocale, setCsvLocale] = useState<CsvLocale>('es');

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-medium">{t('selectTarget')}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {MIGRATION_TARGETS.map((target) => (
            <button
              key={target}
              onClick={() => setSelectedTarget(target)}
              className={`rounded-lg border p-4 text-left transition-colors hover:bg-accent ${
                selectedTarget === target ? 'border-primary bg-accent' : 'border-border'
              }`}
            >
              <p className="font-medium">{t(target)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('prerequisite', { items: PREREQUISITES[target] })}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">{t('csvLanguage')}</h2>
        <Select value={csvLocale} onValueChange={(val) => setCsvLocale((val as CsvLocale) ?? 'es')}>
          <SelectTrigger className="w-48">
            <SelectValue>{LOCALE_LABELS[csvLocale]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CSV_LOCALES.map((loc) => (
              <SelectItem key={loc} value={loc}>{LOCALE_LABELS[loc]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={() => selectedTarget && onSelect(selectedTarget, csvLocale)}
        disabled={!selectedTarget}
      >
        {t('next')}
      </Button>
    </div>
  );
}
