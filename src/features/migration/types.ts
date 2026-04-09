// ── Migration Targets ───────────────────────────────

export const MIGRATION_TARGETS = ['clients', 'talents', 'orders'] as const;
export type MigrationTarget = (typeof MIGRATION_TARGETS)[number];

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
  surveyQuestionId?: string | null;
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

// ── Lookups (for resolving names → UUIDs) ───────────

export type ImportLookups = {
  citiesByName: Map<string, string>;
  countriesByName: Map<string, string>;
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
