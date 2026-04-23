import {
  getColumnDef,
  normalizeColumnOptions,
} from '@/shared/lib/forms/db-column-registry';
import type { DbColumnTarget } from './types';
import type { Sb } from './persistence/context';
import { lookupMessage, snakeToCamel } from './i18n-lookup';

const FALLBACK_LOCALE = 'es';

export type DbColumnOption = {
  id: string;
  name: string;
};

// Resuelve la etiqueta traducida de una opción de db_column con cadena
// A (explícita) → B (convención) → raw value.
// - A: la option declaró { value, labelKey } en el registry → usar ese key.
// - B: fallback a convención "DbColumnOptions.${camelCase(column)}_${value}"
//   — matchea las keys existentes en src/lib/i18n/messages/*.json.
// - Raw: si ninguna resuelve, retorna el value crudo.
function resolveOptionLabel(
  column: string,
  value: string,
  explicitKey: string | undefined,
  locale: string
): string {
  if (explicitKey) {
    const hit = lookupMessage(explicitKey, locale);
    if (hit) return hit;
  }
  const conventionKey = `DbColumnOptions.${snakeToCamel(column)}_${value}`;
  const convHit = lookupMessage(conventionKey, locale);
  if (convHit) return convHit;
  return value;
}

// Resuelve las opciones de un field db_column + (single|multi)select.
// Dos modos:
//   - options (estáticas, ahora con labelKey opcional): traducidas via
//     lookupMessage → A+B.
//   - optionsSource='spoken_languages': query dinámica con fallback
//     locale→es al name de cada row.
// Retorna null si el column no aporta options.
export async function loadDbColumnOptions(
  supabase: Sb,
  target: DbColumnTarget,
  locale: string
): Promise<DbColumnOption[] | null> {
  const colDef = getColumnDef(target.table, target.column);
  if (!colDef) return null;

  if (colDef.options) {
    const normalized = normalizeColumnOptions(colDef.options);
    return normalized.map((opt) => ({
      id: opt.value,
      name: resolveOptionLabel(target.column, opt.value, opt.labelKey, locale),
    }));
  }

  if (colDef.optionsSource === 'spoken_languages') {
    const { data, error } = await supabase
      .from('spoken_languages')
      .select(
        'code, is_active, spoken_language_translations(locale, name)'
      )
      .eq('is_active', true);
    if (error || !data) return [];
    return data.map((row) => {
      const trans =
        (row.spoken_language_translations as unknown as {
          locale: string;
          name: string;
        }[]) ?? [];
      const pick = (l: string) => trans.find((t) => t.locale === l)?.name;
      const name = pick(locale) ?? pick(FALLBACK_LOCALE) ?? row.code;
      return { id: row.code as string, name };
    });
  }

  return null;
}

// Helper para el admin — sync, lee solo registry (sin DB). Si hay
// optionsSource, retorna null (admin no puede preview sin DB). Si hay
// static options, retorna solo los values crudos.
export function getStaticDbColumnOptions(
  target: DbColumnTarget
): string[] | null {
  const colDef = getColumnDef(target.table, target.column);
  if (!colDef?.options) return null;
  return normalizeColumnOptions(colDef.options).map((o) => o.value);
}

export function dbColumnHasAutoOptions(target: DbColumnTarget): boolean {
  const colDef = getColumnDef(target.table, target.column);
  if (!colDef) return false;
  return Boolean(
    (colDef.options && colDef.options.length > 0) || colDef.optionsSource
  );
}
