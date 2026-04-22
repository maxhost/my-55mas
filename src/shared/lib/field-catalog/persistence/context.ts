import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

export type Sb = SupabaseClient<Database>;

export class PersistenceError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'unsupported_table'
      | 'unsupported_column'
      | 'missing_context'
      | 'write_failed'
      | 'read_failed'
  ) {
    super(message);
    this.name = 'PersistenceError';
  }
}

// Tablas de db_column cuyo row selector es el userId (v1).
// Otras tablas (orders, etc.) requieren contexto específico — fuera de scope v1.
export const USER_OWNED_DB_COLUMN_TABLES = {
  profiles: { keyColumn: 'id' },
  talent_profiles: { keyColumn: 'user_id' },
  client_profiles: { keyColumn: 'user_id' },
} as const;

export type UserOwnedTable = keyof typeof USER_OWNED_DB_COLUMN_TABLES;

export function isUserOwnedTable(table: string): table is UserOwnedTable {
  return table in USER_OWNED_DB_COLUMN_TABLES;
}
