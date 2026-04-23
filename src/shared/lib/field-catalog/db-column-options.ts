import { getColumnDef } from '@/shared/lib/forms/db-column-registry';
import type { DbColumnTarget } from './types';
import type { Sb } from './persistence/context';

const FALLBACK_LOCALE = 'es';

export type DbColumnOption = {
  id: string;
  name: string;
};

// Resuelve las opciones de un field db_column + (single|multi)select leyendo
// del DB_COLUMN_REGISTRY. Dos modos:
//   - options estáticas (ej. profiles.gender → male/female/...): id === value
//     y name === value (admin puede mapear traducciones en option_labels).
//   - optionsSource='spoken_languages': query dinámica con fallback locale→es.
// Retorna null si el column no aporta options (caller decide usar options
// manuales del admin o nada).
export async function loadDbColumnOptions(
  supabase: Sb,
  target: DbColumnTarget,
  locale: string
): Promise<DbColumnOption[] | null> {
  const colDef = getColumnDef(target.table, target.column);
  if (!colDef) return null;

  if (colDef.options && colDef.options.length > 0) {
    return colDef.options.map((opt) => ({ id: opt, name: opt }));
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
// static options, retorna la lista. Para UX informativa en el sheet.
export function getStaticDbColumnOptions(
  target: DbColumnTarget
): string[] | null {
  const colDef = getColumnDef(target.table, target.column);
  if (!colDef) return null;
  if (colDef.options && colDef.options.length > 0) return [...colDef.options];
  return null;
}

export function dbColumnHasAutoOptions(target: DbColumnTarget): boolean {
  const colDef = getColumnDef(target.table, target.column);
  if (!colDef) return false;
  return Boolean(
    (colDef.options && colDef.options.length > 0) || colDef.optionsSource
  );
}
