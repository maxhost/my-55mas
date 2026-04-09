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
import type { ColumnMapping, DbColumn, SurveyQuestionOption } from '../types';

type Props = {
  mappings: ColumnMapping[];
  dbColumns: DbColumn[];
  surveyQuestions: SurveyQuestionOption[];
  onMappingChange: (
    csvColumn: string,
    dbColumn: string | null,
    surveyQuestionId?: string | null
  ) => void;
};

export function ColumnMapper({
  mappings,
  dbColumns,
  surveyQuestions,
  onMappingChange,
}: Props) {
  const t = useTranslations('AdminMigration');

  // Count how many times each DB column is used (for shared indicator)
  const dbColumnUsage = new Map<string, number>();
  for (const m of mappings) {
    if (m.dbColumn && m.dbColumn !== 'survey_question') {
      dbColumnUsage.set(m.dbColumn, (dbColumnUsage.get(m.dbColumn) ?? 0) + 1);
    }
  }

  // Track which survey questions are already assigned
  const usedSurveyIds = new Set(
    mappings.filter((m) => m.surveyQuestionId).map((m) => m.surveyQuestionId!)
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">{t('mapColumns')}</h2>
      <div className="space-y-2">
        {mappings.map((mapping) => {
          const isSurvey = mapping.dbColumn === 'survey_question';
          const isShared =
            mapping.dbColumn &&
            mapping.dbColumn !== 'survey_question' &&
            (dbColumnUsage.get(mapping.dbColumn) ?? 0) > 1;

          return (
            <div
              key={mapping.csvColumn}
              className="flex items-center gap-3 rounded-lg border border-border p-3"
            >
              <div className="min-w-[180px]">
                <p className="text-sm font-medium">{mapping.csvColumn}</p>
              </div>

              <span className="text-muted-foreground">→</span>

              {/* DB Column select */}
              <div className="min-w-[200px]">
                <Select
                  value={mapping.dbColumn ?? '_unmapped'}
                  onValueChange={(val) =>
                    onMappingChange(
                      mapping.csvColumn,
                      val === '_unmapped' ? null : (val ?? null),
                      null
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('unmapped')}>
                      {mapping.dbColumn
                        ? dbColumns.find((c) => c.name === mapping.dbColumn)?.name ??
                          mapping.dbColumn
                        : t('unmapped')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_unmapped">{t('unmapped')}</SelectItem>
                    {dbColumns.map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name}
                        {col.required ? ' *' : ''}
                        {col.description ? ` — ${col.description}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Survey question sub-select (when survey_question is chosen) */}
              {isSurvey && (
                <div className="min-w-[220px]">
                  <Select
                    value={mapping.surveyQuestionId ?? '_none'}
                    onValueChange={(val) =>
                      onMappingChange(
                        mapping.csvColumn,
                        'survey_question',
                        val === '_none' ? null : (val ?? null)
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectQuestion')}>
                        {mapping.surveyQuestionId
                          ? surveyQuestions.find((q) => q.id === mapping.surveyQuestionId)?.label
                          : t('selectQuestion')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">{t('selectQuestion')}</SelectItem>
                      {surveyQuestions.map((q) => (
                        <SelectItem
                          key={q.id}
                          value={q.id}
                          disabled={
                            usedSurveyIds.has(q.id) &&
                            mapping.surveyQuestionId !== q.id
                          }
                        >
                          {q.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Indicators */}
              {isShared && (
                <Badge variant="outline" className="text-xs">
                  {t('shared')}
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground">
        * = {t('required')}
      </div>
    </div>
  );
}
