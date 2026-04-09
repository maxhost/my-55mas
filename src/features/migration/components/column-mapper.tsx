'use client';

import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type {
  ColumnMapping,
  DbColumn,
  SurveyQuestionOption,
  ServiceOption,
  SubtypeGroupOption,
} from '../types';

type Props = {
  mappings: ColumnMapping[];
  dbColumns: DbColumn[];
  surveyQuestions: SurveyQuestionOption[];
  serviceOptions: ServiceOption[];
  subtypeGroupOptions: SubtypeGroupOption[];
  onMappingChange: (
    csvColumn: string,
    dbColumn: string | null,
    secondaryId?: string | null
  ) => void;
};

const REUSABLE_COLUMNS = new Set([
  'survey_question',
  'service_column',
  'service_subtype_column',
]);

export function ColumnMapper({
  mappings,
  dbColumns,
  surveyQuestions,
  serviceOptions,
  subtypeGroupOptions,
  onMappingChange,
}: Props) {
  const t = useTranslations('AdminMigration');

  const dbColumnUsage = new Map<string, number>();
  for (const m of mappings) {
    if (m.dbColumn && !REUSABLE_COLUMNS.has(m.dbColumn)) {
      dbColumnUsage.set(m.dbColumn, (dbColumnUsage.get(m.dbColumn) ?? 0) + 1);
    }
  }

  const usedSecondaryIds = new Set(
    mappings.filter((m) => m.secondaryId).map((m) => m.secondaryId!)
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">{t('mapColumns')}</h2>
      <div className="space-y-2">
        {mappings.map((mapping) => {
          const dbCol = mapping.dbColumn;
          const isReusable = dbCol !== null && REUSABLE_COLUMNS.has(dbCol);
          const isShared = dbCol && !isReusable && (dbColumnUsage.get(dbCol) ?? 0) > 1;

          return (
            <div
              key={mapping.csvColumn}
              className="flex items-center gap-3 rounded-lg border border-border p-3"
            >
              <div className="min-w-[180px]">
                <p className="text-sm font-medium">{mapping.csvColumn}</p>
              </div>

              <span className="text-muted-foreground">→</span>

              <div className="min-w-[200px]">
                <Select
                  value={dbCol ?? '_unmapped'}
                  onValueChange={(val) =>
                    onMappingChange(mapping.csvColumn, val === '_unmapped' ? null : (val ?? null), null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('unmapped')}>
                      {dbCol ? dbColumns.find((c) => c.name === dbCol)?.name ?? dbCol : t('unmapped')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_unmapped">{t('unmapped')}</SelectItem>
                    {dbColumns.map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name}{col.required ? ' *' : ''}
                        {col.description ? ` — ${col.description}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Secondary select for special column types */}
              {dbCol === 'survey_question' && (
                <SecondarySelect
                  value={mapping.secondaryId}
                  placeholder={t('selectQuestion')}
                  options={surveyQuestions.map((q) => ({ id: q.id, label: q.label }))}
                  usedIds={usedSecondaryIds}
                  currentId={mapping.secondaryId}
                  onChange={(id) => onMappingChange(mapping.csvColumn, dbCol, id)}
                />
              )}

              {dbCol === 'service_column' && (
                <SecondarySelect
                  value={mapping.secondaryId}
                  placeholder={t('selectService')}
                  options={serviceOptions.map((s) => ({ id: s.id, label: s.name }))}
                  usedIds={usedSecondaryIds}
                  currentId={mapping.secondaryId}
                  onChange={(id) => onMappingChange(mapping.csvColumn, dbCol, id)}
                />
              )}

              {dbCol === 'service_subtype_column' && (
                <SecondarySelect
                  value={mapping.secondaryId}
                  placeholder={t('selectSubtypeGroup')}
                  options={subtypeGroupOptions.map((g) => ({ id: g.id, label: `${g.serviceSlug} — ${g.groupName}` }))}
                  usedIds={usedSecondaryIds}
                  currentId={mapping.secondaryId}
                  onChange={(id) => onMappingChange(mapping.csvColumn, dbCol, id)}
                />
              )}

              {isShared && (
                <Badge variant="outline" className="text-xs">{t('shared')}</Badge>
              )}
            </div>
          );
        })}
      </div>
      <div className="text-xs text-muted-foreground">* = {t('required')}</div>
    </div>
  );
}

type SecondarySelectProps = {
  value: string | null | undefined;
  placeholder: string;
  options: { id: string; label: string }[];
  usedIds: Set<string>;
  currentId: string | null | undefined;
  onChange: (id: string | null) => void;
};

function SecondarySelect({ value, placeholder, options, usedIds, currentId, onChange }: SecondarySelectProps) {
  return (
    <div className="min-w-[220px]">
      <Select
        value={value ?? '_none'}
        onValueChange={(val) => onChange(val === '_none' ? null : (val ?? null))}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            {value ? options.find((o) => o.id === value)?.label : placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_none">{placeholder}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id} disabled={usedIds.has(o.id) && currentId !== o.id}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
