'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DB_COLUMN_REGISTRY, getTableDef, getColumnDef } from '@/shared/lib/forms/db-column-registry';
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

  const tables = allowedTables.filter((key) => key in DB_COLUMN_REGISTRY);

  if (tables.length === 0) {
    return (
      <div className="bg-muted/50 ml-6 rounded-md p-3">
        <p className="text-muted-foreground text-xs">{t('dbColumnInfo')}</p>
      </div>
    );
  }

  const tableDef = field.db_table ? getTableDef(field.db_table) : undefined;
  const columnDef = field.db_table && field.db_column
    ? getColumnDef(field.db_table, field.db_column)
    : undefined;

  const handleTableChange = (table: string) => {
    onChange({ ...field, db_table: table || undefined, db_column: undefined, options: undefined });
  };

  const handleColumnChange = (column: string) => {
    const colDef = field.db_table ? getColumnDef(field.db_table, column) : undefined;
    const options = colDef?.options ? [...colDef.options] : undefined;
    onChange({ ...field, db_column: column || undefined, options });
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

      {/* Option labels for select-type columns */}
      {columnDef?.options && columnDef.options.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs">{t('optionLabels')}</Label>
          {columnDef.options.map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <span className="text-muted-foreground w-24 truncate font-mono text-xs">{opt}</span>
              <Input
                value={optionLabels[`${field.key}.${opt}`] ?? ''}
                onChange={(e) => onOptionLabelChange(`${field.key}.${opt}`, e.target.value)}
                placeholder={opt}
                className="h-6 text-xs"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
