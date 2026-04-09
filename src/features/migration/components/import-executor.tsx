'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { BatchProgress } from './batch-progress';
import { executeBatch } from '../actions/execute-batch';
import { getImportLookups } from '../actions/get-lookup-data';
import { transformClients } from '../lib/transformers/transform-clients';
import { transformTalents } from '../lib/transformers/transform-talents';
import { transformOrders } from '../lib/transformers/transform-orders';
import type {
  MigrationTarget,
  ColumnMapping,
  ImportSummary,
  ImportLookups,
  RowError,
} from '../types';
import type { OrderLookups } from '../lib/transformers/transform-orders';

type Props = {
  target: MigrationTarget;
  rows: Record<string, string>[];
  mappings: ColumnMapping[];
  locale: string;
  orderLookups?: OrderLookups;
};

const BATCH_SIZE_AUTH = 50;
const BATCH_SIZE_BULK = 500;

export function ImportExecutor({ target, rows, mappings, locale, orderLookups }: Props) {
  const t = useTranslations('AdminMigration');
  const [processed, setProcessed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const batchSize = target === 'orders' ? BATCH_SIZE_BULK : BATCH_SIZE_AUTH;

  const runImport = useCallback(async () => {
    setIsRunning(true);
    setProcessed(0);
    setSummary(null);

    // Load lookups for city/country resolution
    let lookups: ImportLookups | undefined;
    if (target === 'clients' || target === 'talents') {
      lookups = await getImportLookups(locale);
    }

    let totalInserted = 0;
    const allErrors: RowError[] = [];

    for (let offset = 0; offset < rows.length; offset += batchSize) {
      const batch = rows.slice(offset, offset + batchSize);

      let transformedData: unknown[];
      let transformErrors: RowError[];

      if (target === 'clients') {
        const result = transformClients(batch, mappings, offset);
        transformedData = result.data;
        transformErrors = result.errors;
      } else if (target === 'talents') {
        const result = transformTalents(batch, mappings, offset);
        transformedData = result.data;
        transformErrors = result.errors;
      } else {
        const result = transformOrders(batch, mappings, orderLookups!, offset);
        transformedData = result.data;
        transformErrors = result.errors;
      }

      allErrors.push(...transformErrors);

      if (transformedData.length > 0) {
        const batchResult = await executeBatch(target, transformedData, offset, lookups);
        totalInserted += batchResult.inserted;
        allErrors.push(...batchResult.errors);
      }

      setProcessed(Math.min(offset + batchSize, rows.length));
      // Yield to event loop so React can repaint the progress bar
      await new Promise((r) => setTimeout(r, 0));
    }

    setSummary({
      totalRows: rows.length,
      inserted: totalInserted,
      errored: allErrors.length,
      skipped: rows.length - totalInserted - allErrors.length,
      errors: allErrors,
    });
    setIsRunning(false);
  }, [target, rows, mappings, locale, orderLookups, batchSize]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">{t('import')}</h2>

      <div className="text-sm text-muted-foreground">
        {t('rowsDetected', { count: rows.length })}
      </div>

      {!isRunning && !summary && (
        <Button onClick={runImport} disabled={rows.length === 0}>
          {t('import')}
        </Button>
      )}

      {(isRunning || summary) && (
        <BatchProgress
          processed={processed}
          total={rows.length}
          summary={summary}
          isRunning={isRunning}
        />
      )}
    </div>
  );
}
