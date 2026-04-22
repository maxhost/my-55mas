import type { DbColumnTarget } from '../types';
import {
  PersistenceError,
  USER_OWNED_DB_COLUMN_TABLES,
  isUserOwnedTable,
  type Sb,
} from './context';

export async function readDbColumn(
  supabase: Sb,
  userId: string,
  target: DbColumnTarget
): Promise<unknown> {
  if (!isUserOwnedTable(target.table)) {
    throw new PersistenceError(
      `db_column adapter v1 does not support table "${target.table}"`,
      'unsupported_table'
    );
  }
  const { keyColumn } = USER_OWNED_DB_COLUMN_TABLES[target.table];
  const { data, error } = await supabase
    .from(target.table)
    .select(target.column)
    .eq(keyColumn, userId)
    .maybeSingle();
  if (error) {
    throw new PersistenceError(
      `read ${target.table}.${target.column} failed: ${error.message}`,
      'read_failed'
    );
  }
  return (data as Record<string, unknown> | null)?.[target.column] ?? undefined;
}

export async function writeDbColumn(
  supabase: Sb,
  userId: string,
  value: unknown,
  target: DbColumnTarget
): Promise<void> {
  if (!isUserOwnedTable(target.table)) {
    throw new PersistenceError(
      `db_column adapter v1 does not support table "${target.table}"`,
      'unsupported_table'
    );
  }
  const { keyColumn } = USER_OWNED_DB_COLUMN_TABLES[target.table];
  const { error } = await supabase
    .from(target.table)
    .update({ [target.column]: value })
    .eq(keyColumn, userId);
  if (error) {
    throw new PersistenceError(
      `write ${target.table}.${target.column} failed: ${error.message}`,
      'write_failed'
    );
  }
}
