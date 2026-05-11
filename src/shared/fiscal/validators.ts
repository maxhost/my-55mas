import type { FiscalValidationResult } from './types';

// Hardcoded regex per fiscal_id_types.code. Format-only — does not verify
// checksum digits (NIF letter, CUIT control digit). If an admin adds a new
// code to the DB without a matching entry here, validateFiscalId accepts
// the value with a warning (see "unknown_type" branch). The list below must
// stay in sync with active rows of fiscal_id_types; the test suite verifies
// every known code has an entry.
//
// Case-insensitive: matching is done against the upper-cased value so users
// can type "12345678z" and pass.
export const FISCAL_VALIDATORS: Record<string, RegExp> = {
  NIF: /^[0-9]{8}[A-Z]$/,
  NIE: /^[XYZ][0-9]{7}[A-Z]$/,
  CUIT: /^[0-9]{2}-?[0-9]{8}-?[0-9]{1}$/,
  CUIL: /^[0-9]{2}-?[0-9]{8}-?[0-9]{1}$/,
};

const MAX_LEN = 64;

export function validateFiscalId(
  value: string | null | undefined,
  code: string | null | undefined,
): FiscalValidationResult {
  const trimmed = (value ?? '').trim();
  if (trimmed.length === 0) return { ok: false, reason: 'empty' };
  if (trimmed.length > MAX_LEN) return { ok: false, reason: 'format' };

  const normalizedCode = (code ?? '').trim().toUpperCase();
  const regex = normalizedCode ? FISCAL_VALIDATORS[normalizedCode] : undefined;
  if (!regex) {
    // Unknown code: accept (UI/server may log a warning to flag missing
    // validator). Returning ok preserves form flow when DB and code drift.
    return { ok: true };
  }

  return regex.test(trimmed.toUpperCase()) ? { ok: true } : { ok: false, reason: 'format' };
}

// Canonical storage form: trim + uppercase. CUIT/CUIL dashes are preserved as
// users typed them; downstream presentation may reformat. NIF/NIE letters are
// always upper.
export function normalizeFiscalId(value: string): string {
  return value.trim().toUpperCase();
}
