'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { TargetSelector } from './target-selector';
import { CsvUploader } from './csv-uploader';
import { ColumnMapper } from './column-mapper';
import { ImportExecutor } from './import-executor';
import { autoMatchColumns } from '../lib/column-matcher';
import { getTableColumns } from '../actions/get-table-columns';
import { getSurveyQuestions } from '../actions/get-lookup-data';
import type {
  MigrationTarget,
  ParsedCSV,
  ColumnMapping,
  DbColumn,
  SurveyQuestionOption,
} from '../types';

type Step = 'target' | 'upload' | 'mapping' | 'import';

type WizardProps = {
  locale: string;
};

export function MigrationWizard({ locale }: WizardProps) {
  const t = useTranslations('AdminMigration');

  const [step, setStep] = useState<Step>('target');
  const [target, setTarget] = useState<MigrationTarget | null>(null);
  const [csvData, setCsvData] = useState<ParsedCSV | null>(null);
  const [dbColumns, setDbColumns] = useState<DbColumn[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestionOption[]>([]);

  const handleTargetSelect = useCallback(async (t: MigrationTarget) => {
    setTarget(t);
    const [cols, questions] = await Promise.all([
      getTableColumns(t),
      getSurveyQuestions(locale),
    ]);
    setDbColumns(cols);
    setSurveyQuestions(questions);
    setStep('upload');
  }, [locale]);

  const handleCsvParsed = useCallback(
    (data: ParsedCSV) => {
      setCsvData(data);
      const autoMapped = autoMatchColumns(data.headers, dbColumns);
      setMappings(autoMapped);
    },
    [dbColumns]
  );

  const handleMappingChange = useCallback(
    (csvColumn: string, dbColumn: string | null, surveyQuestionId?: string | null) => {
      setMappings((prev) =>
        prev.map((m) =>
          m.csvColumn === csvColumn
            ? { ...m, dbColumn, surveyQuestionId: surveyQuestionId ?? null }
            : m
        )
      );
    },
    []
  );

  const requiredMet = dbColumns
    .filter((c) => c.required)
    .every((c) => mappings.some((m) => m.dbColumn === c.name));

  const handleBack = () => {
    if (step === 'upload') setStep('target');
    else if (step === 'mapping') setStep('upload');
    else if (step === 'import') setStep('mapping');
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex gap-2 text-sm">
        {(['target', 'upload', 'mapping', 'import'] as Step[]).map((s, i) => (
          <span
            key={s}
            className={`rounded-full px-3 py-1 ${
              s === step
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {i + 1}
          </span>
        ))}
      </div>

      {step === 'target' && (
        <TargetSelector onSelect={handleTargetSelect} />
      )}

      {step === 'upload' && (
        <>
          <CsvUploader onParsed={handleCsvParsed} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack}>{t('back')}</Button>
            <Button onClick={() => setStep('mapping')} disabled={!csvData}>{t('next')}</Button>
          </div>
        </>
      )}

      {step === 'mapping' && (
        <>
          <ColumnMapper
            mappings={mappings}
            dbColumns={dbColumns}
            surveyQuestions={surveyQuestions}
            onMappingChange={handleMappingChange}
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack}>{t('back')}</Button>
            <Button onClick={() => setStep('import')} disabled={!requiredMet}>{t('next')}</Button>
          </div>
        </>
      )}

      {step === 'import' && target && csvData && (
        <>
          <ImportExecutor
            target={target}
            rows={csvData.rows}
            mappings={mappings}
            locale={locale}
          />
          <Button variant="outline" onClick={handleBack}>{t('back')}</Button>
        </>
      )}
    </div>
  );
}
