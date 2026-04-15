// ── Migration Targets ───────────────────────────────

export const MIGRATION_TARGETS = ['clients', 'talents', 'orders'] as const;
export type MigrationTarget = (typeof MIGRATION_TARGETS)[number];

// ── CSV Locale ──────────────────────────────────────

export const CSV_LOCALES = ['es', 'en', 'pt', 'fr', 'ca'] as const;
export type CsvLocale = (typeof CSV_LOCALES)[number];

// ── CSV Parsing ─────────────────────────────────────

export type ParsedCSV = {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  delimiter: string;
};

// ── Column Mapping ──────────────────────────────────

export type ColumnMapping = {
  csvColumn: string;
  dbColumn: string | null;
  secondaryId?: string | null;
};

export type DbColumn = {
  name: string;
  required: boolean;
  description?: string;
};

// ── Survey Questions ────────────────────────────────

export type SurveyQuestionOption = {
  id: string;
  key: string;
  label: string;
};

// ── Service Options (for talent import mapping) ─────

export type ServiceOption = {
  id: string;
  slug: string;
  name: string;
};

export type SubtypeGroupOption = {
  id: string;
  serviceSlugs: string[];
  groupName: string;
  items: { id: string; name: string }[];
};

// ── Talent Tags (local; no import from @/features/talent-tags — feature isolation) ──

export type TalentTagOption = {
  id: string;
  name: string;
};

// ── Lookups (for resolving names → UUIDs) ───────────

import type { SpokenLanguageAliasMap } from '@/shared/lib/spoken-languages/types';

export type ImportLookups = {
  citiesByName: Map<string, string>;
  countriesByName: Map<string, string>;
  defaultCountryId: string | null;
  tagIdsByName?: Map<string, string>;
  spokenLanguageAliases?: SpokenLanguageAliasMap;
};

// ── Batch Processing ────────────────────────────────

export type BatchResult = {
  inserted: number;
  errors: RowError[];
};

export type RowError = {
  rowIndex: number;
  message: string;
};

export type ImportSummary = {
  totalRows: number;
  inserted: number;
  errored: number;
  skipped: number;
  errors: RowError[];
};
