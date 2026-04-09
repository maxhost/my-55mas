'use client';

import { useTranslations } from 'next-intl';
import type { ImportSummary, RowError } from '../types';

type Props = {
  processed: number;
  total: number;
  summary: ImportSummary | null;
  isRunning: boolean;
};

export function BatchProgress({ processed, total, summary, isRunning }: Props) {
  const t = useTranslations('AdminMigration');
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{isRunning ? t('importing') : t('progress', { processed, total })}</span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {t('progress', { processed, total })}
        </p>
      </div>

      {/* Summary */}
      {summary && (
        <div className="space-y-3 rounded-lg border border-border p-4">
          <h3 className="font-medium">{t('summary')}</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{summary.inserted}</p>
              <p className="text-xs text-muted-foreground">{t('inserted')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">{summary.errored}</p>
              <p className="text-xs text-muted-foreground">{t('errors')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-muted-foreground">{summary.skipped}</p>
              <p className="text-xs text-muted-foreground">{t('skipped')}</p>
            </div>
          </div>

          {summary.errors.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded border border-destructive/20 bg-destructive/5 p-3">
              {summary.errors.map((err, i) => (
                <p key={i} className="text-xs text-destructive">
                  Row {err.rowIndex + 1}: {err.message}
                </p>
              ))}
            </div>
          )}

          {summary.errors.length === 0 && (
            <p className="text-sm text-muted-foreground">{t('noErrors')}</p>
          )}
        </div>
      )}
    </div>
  );
}
