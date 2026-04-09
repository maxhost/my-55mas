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
import {
  getSurveyQuestions,
  getServiceOptions,
  getSubtypeGroupOptions,
} from '../actions/get-lookup-data';
import type {
  MigrationTarget,
  CsvLocale,
  ParsedCSV,
  ColumnMapping,
  DbColumn,
  SurveyQuestionOption,
  ServiceOption,
  SubtypeGroupOption,
} from '../types';

type Step = 'target' | 'upload' | 'mapping' | 'import';

type WizardProps = { locale: string };

export function MigrationWizard({ locale }: WizardProps) {
  const t = useTranslations('AdminMigration');

  const [step, setStep] = useState<Step>('target');
  const [target, setTarget] = useState<MigrationTarget | null>(null);
  const [csvLocale, setCsvLocale] = useState<CsvLocale>('es');
  const [csvData, setCsvData] = useState<ParsedCSV | null>(null);
  const [dbColumns, setDbColumns] = useState<DbColumn[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestionOption[]>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [subtypeGroupOptions, setSubtypeGroupOptions] = useState<SubtypeGroupOption[]>([]);

  const handleTargetSelect = useCallback(async (t: MigrationTarget, selectedCsvLocale: CsvLocale) => {
    setTarget(t);
    setCsvLocale(selectedCsvLocale);
    // UI labels use system locale; service/subtype labels also in system locale for the mapper dropdowns
    const [cols, questions, services, subtypeGroups] = await Promise.all([
      getTableColumns(t),
      getSurveyQuestions(locale),
      getServiceOptions(locale),
      getSubtypeGroupOptions(locale),
    ]);
    setDbColumns(cols);
    setSurveyQuestions(questions);
    setServiceOptions(services);
    setSubtypeGroupOptions(subtypeGroups);
    setStep('upload');
  }, [locale]);

  const handleCsvParsed = useCallback(
    (data: ParsedCSV) => {
      setCsvData(data);
      setMappings(autoMatchColumns(data.headers, dbColumns));
    },
    [dbColumns]
  );

  const handleMappingChange = useCallback(
    (csvColumn: string, dbColumn: string | null, secondaryId?: string | null) => {
      setMappings((prev) =>
        prev.map((m) =>
          m.csvColumn === csvColumn
            ? { ...m, dbColumn, secondaryId: secondaryId ?? null }
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
      <div className="flex gap-2 text-sm">
        {(['target', 'upload', 'mapping', 'import'] as Step[]).map((s, i) => (
          <span
            key={s}
            className={`rounded-full px-3 py-1 ${
              s === step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {i + 1}
          </span>
        ))}
      </div>

      {step === 'target' && <TargetSelector onSelect={handleTargetSelect} />}

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
            serviceOptions={serviceOptions}
            subtypeGroupOptions={subtypeGroupOptions}
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
            csvLocale={csvLocale}
          />
          <Button variant="outline" onClick={handleBack}>{t('back')}</Button>
        </>
      )}
    </div>
  );
}
