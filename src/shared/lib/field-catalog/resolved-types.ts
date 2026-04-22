import type { InputType, PersistenceType, PersistenceTarget } from './types';
import type { StepAction } from '@/shared/lib/forms/types';

// ── Resolved Field (ready for rendering) ─────────────

/**
 * A fully resolved field: catalog definition + translation + current value.
 * This is what the form renderer receives — no further lookups needed.
 */
export type ResolvedField = {
  field_definition_id: string;
  key: string;
  input_type: InputType;
  persistence_type: PersistenceType;
  persistence_target: PersistenceTarget;
  required: boolean;
  label: string;
  placeholder: string;
  description?: string;
  options: string[] | null;
  options_source: string | null;
  option_labels?: Record<string, string>;
  current_value?: unknown;
};

// ── Resolved Step ────────────────────────────────────

export type ResolvedStep = {
  key: string;
  label: string;
  fields: ResolvedField[];
  actions?: StepAction[];
};

// ── Resolved Form ────────────────────────────────────

/**
 * A fully resolved form ready for client-side rendering.
 * All field definitions have been loaded, translated, and enriched
 * with current values.
 */
export type ResolvedForm = {
  steps: ResolvedStep[];
};
