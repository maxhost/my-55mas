import type { StepAction } from '@/shared/lib/forms/types';

// ── Catalog Field Reference (per-form) ───────────────

/**
 * A reference to a field in the catalog, used within a form schema.
 * The `required` flag is per-form — same field can be required in one
 * form but optional in another.
 */
export type CatalogFieldRef = {
  field_definition_id: string;
  required: boolean;
};

// ── Catalog Form Step ────────────────────────────────

export type CatalogFormStep = {
  key: string;
  field_refs: CatalogFieldRef[];
  actions?: StepAction[];
};

// ── Catalog Form Schema ──────────────────────────────

/**
 * The new form schema format. Forms reference fields from the catalog
 * by UUID instead of defining them inline.
 */
export type CatalogFormSchema = {
  steps: CatalogFormStep[];
};

// ── Variant Override (for cascade) ───────────────────

/**
 * A variant can add/remove field refs and override required flags
 * relative to the general form.
 */
export type VariantOverride = {
  added: CatalogFieldRef[];
  removed: string[]; // field_definition_ids to remove
  require_overrides: Record<string, boolean>; // field_definition_id → required
};
