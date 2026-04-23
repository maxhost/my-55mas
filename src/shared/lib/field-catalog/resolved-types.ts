import type {
  FieldConfig,
  InputType,
  PersistenceType,
  PersistenceTarget,
} from './types';
import type { StepActionType } from '@/shared/lib/forms/types';

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
  config?: FieldConfig | null;
  current_value?: unknown;
};

// ── Resolved Action (translated for rendering) ───────

/**
 * A step action enriched with its translated label. `key` remains the
 * stable identifier used by handlers; `label` is the user-facing text.
 */
export type ResolvedAction = {
  key: string;
  type: StepActionType;
  label: string;
  redirect_url?: string;
};

// ── Resolved Step ────────────────────────────────────

export type ResolvedStep = {
  key: string;
  label: string;
  fields: ResolvedField[];
  actions?: ResolvedAction[];
};

// ── Resolved Form ────────────────────────────────────

/**
 * A fully resolved form ready for client-side rendering.
 * All field definitions, step labels, and action labels have been loaded
 * and translated. Current user values are pre-populated.
 */
export type ResolvedForm = {
  steps: ResolvedStep[];
};
