'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DB_COLUMN_REGISTRY,
  getTableDef,
  getColumnDef,
  normalizeColumnOptions,
} from '@/shared/lib/forms/db-column-registry';
import { getSpokenLanguageOptions } from '@/shared/lib/spoken-languages/actions';
import type { FormField } from '@/shared/lib/forms/types';

type Props = {
  field: FormField;
  allowedTables: string[];
  optionLabels: Record<string, string>;
  onChange: (field: FormField) => void;
  onOptionLabelChange: (compositeKey: string, value: string) => void;
};

export function DbColumnFieldConfig({
  field,
  allowedTables,
  optionLabels,
  onChange,
  onOptionLabelChange,
}: Props) {
  const t = useTranslations('AdminFormBuilder');
  const tTables = useTranslations('DbTables');
  const tColumns = useTranslations('DbColumns');
  const locale = useLocale();
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const tables = allowedTables.filter((key) => key in DB_COLUMN_REGISTRY);

  const tableDef = field.db_table ? getTableDef(field.db_table) : undefined;
  const columnDef = field.db_table && field.db_column
    ? getColumnDef(field.db_table, field.db_column)
    : undefined;

  // Hydrate dynamic options for columns with optionsSource (e.g. spoken_languages).
  // Runs when the mapping changes or the admin locale changes.
  useEffect(() => {
    if (columnDef?.optionsSource !== 'spoken_languages') return;

    let cancelled = false;
    setLoadingOptions(true);
    setOptionsError(null);
    getSpokenLanguageOptions(locale)
      .then((opts) => {
        if (cancelled) return;
        const snapshot = opts.map((o) => ({ value: o.code, label: o.label }));
        const codes = opts.map((o) => o.code);
        onChangeRef.current({
          ...field,
          options: codes,
          options_snapshot: snapshot,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setOptionsError(t('failedToLoadOptions'));
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.db_table, field.db_column, columnDef?.optionsSource, locale]);

  if (tables.length === 0) {
    return (
      <div className="bg-muted/50 ml-6 rounded-md p-3">
        <p className="text-muted-foreground text-xs">{t('dbColumnInfo')}</p>
      </div>
    );
  }

  const handleTableChange = (table: string) => {
    onChange({
      ...field,
      db_table: table || undefined,
      db_column: undefined,
      options: undefined,
      options_snapshot: undefined,
    });
  };

  const handleColumnChange = (column: string) => {
    const colDef = field.db_table ? getColumnDef(field.db_table, column) : undefined;
    const options = colDef?.options
      ? normalizeColumnOptions(colDef.options).map((o) => o.value)
      : undefined;
    onChange({
      ...field,
      db_column: column || undefined,
      options,
      options_snapshot: undefined,
    });
  };

  return (
    <div className="bg-muted/50 ml-6 space-y-2 rounded-md p-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-0.5">
          <Label className="text-xs">{t('dbTable')}</Label>
          <select
            value={field.db_table ?? ''}
            onChange={(e) => handleTableChange(e.target.value)}
            className="border-input bg-background h-7 w-full rounded-md border px-2 text-xs"
          >
            <option value="">{t('selectTable')}</option>
            {tables.map((key) => (
              <option key={key} value={key}>{tTables(key)}</option>
            ))}
          </select>
        </div>
        <div className="space-y-0.5">
          <Label className="text-xs">{t('dbColumn')}</Label>
          <select
            value={field.db_column ?? ''}
            onChange={(e) => handleColumnChange(e.target.value)}
            disabled={!tableDef}
            className="border-input bg-background h-7 w-full rounded-md border px-2 text-xs disabled:opacity-50"
          >
            <option value="">{t('selectColumn')}</option>
            {tableDef && Object.entries(tableDef.columns).map(([colKey, colDef]) => (
              <option key={colKey} value={colKey}>{tColumns(colDef.labelKey.replace('DbColumns.', ''))}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic options status (e.g. spoken_languages) */}
      {columnDef?.optionsSource && (
        <div className="text-muted-foreground space-y-0.5 text-xs">
          {loadingOptions && <p>{t('loadingOptions')}</p>}
          {optionsError && <p className="text-destructive">{optionsError}</p>}
          {!loadingOptions && !optionsError && field.options_snapshot && (
            <p>{t('dynamicOptionsLoaded', { count: field.options_snapshot.length })}</p>
          )}
        </div>
      )}

      {/* Option labels for select-type columns */}
      {columnDef?.options && columnDef.options.length > 0 && !columnDef.optionsSource && (
        <div className="space-y-1">
          <Label className="text-xs">{t('optionLabels')}</Label>
          {normalizeColumnOptions(columnDef.options).map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <span className="text-muted-foreground w-24 truncate font-mono text-xs">{opt.value}</span>
              <Input
                value={optionLabels[`${field.key}.${opt.value}`] ?? ''}
                onChange={(e) => onOptionLabelChange(`${field.key}.${opt.value}`, e.target.value)}
                placeholder={opt.value}
                className="h-6 text-xs"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
