// ── Types ────────────────────────────────────────────

export type InputType =
  | 'text'
  | 'email'
  | 'date'
  | 'number'
  | 'boolean'
  | 'select'
  | 'textarea'
  | 'password';

export type ColumnDef = {
  inputType: InputType;
  labelKey: string;
  options?: readonly string[];
};

export type TableDef = {
  labelKey: string;
  columns: Record<string, ColumnDef>;
};

// ── Registry ─────────────────────────────────────────
// Static mapping of tables/columns available for form field mapping.
// Does NOT include: FKs (city_id, country_id), system columns (id, timestamps),
// or profiles.email (handled by 'email' field type for Supabase Auth).

export const DB_COLUMN_REGISTRY: Record<string, TableDef> = {
  profiles: {
    labelKey: 'DbTables.profiles',
    columns: {
      full_name: { inputType: 'text', labelKey: 'DbColumns.fullName' },
      phone: { inputType: 'text', labelKey: 'DbColumns.phone' },
      nif: { inputType: 'text', labelKey: 'DbColumns.nif' },
      preferred_contact: {
        inputType: 'select',
        labelKey: 'DbColumns.preferredContact',
        options: ['email', 'phone', 'whatsapp'],
      },
    },
  },
  talent_profiles: {
    labelKey: 'DbTables.talentProfiles',
    columns: {
      birth_date: { inputType: 'date', labelKey: 'DbColumns.birthDate' },
      gender: {
        inputType: 'select',
        labelKey: 'DbColumns.gender',
        options: ['male', 'female', 'other', 'prefer_not_to_say'],
      },
      address: { inputType: 'text', labelKey: 'DbColumns.address' },
      postal_code: { inputType: 'text', labelKey: 'DbColumns.postalCode' },
      has_car: { inputType: 'boolean', labelKey: 'DbColumns.hasCar' },
      preferred_payment: {
        inputType: 'select',
        labelKey: 'DbColumns.preferredPayment',
        options: ['bank_transfer', 'cash', 'paypal'],
      },
      professional_status: {
        inputType: 'select',
        labelKey: 'DbColumns.professionalStatus',
        options: ['employed', 'retired', 'freelance', 'unemployed'],
      },
    },
  },
  client_profiles: {
    labelKey: 'DbTables.clientProfiles',
    columns: {
      company_name: { inputType: 'text', labelKey: 'DbColumns.companyName' },
      company_tax_id: { inputType: 'text', labelKey: 'DbColumns.companyTaxId' },
    },
  },
  orders: {
    labelKey: 'DbTables.orders',
    columns: {
      contact_name: { inputType: 'text', labelKey: 'DbColumns.contactName' },
      contact_email: { inputType: 'email', labelKey: 'DbColumns.contactEmail' },
      contact_phone: { inputType: 'text', labelKey: 'DbColumns.contactPhone' },
      contact_address: { inputType: 'text', labelKey: 'DbColumns.contactAddress' },
      service_address: { inputType: 'text', labelKey: 'DbColumns.serviceAddress' },
      notes: { inputType: 'textarea', labelKey: 'DbColumns.notes' },
    },
  },
  auth: {
    labelKey: 'DbTables.auth',
    columns: {
      email: { inputType: 'email', labelKey: 'DbColumns.authEmail' },
      password: { inputType: 'password', labelKey: 'DbColumns.authPassword' },
      confirm_password: { inputType: 'password', labelKey: 'DbColumns.authConfirmPassword' },
    },
  },
} as const;

// ── Helpers ──────────────────────────────────────────

export function getTableDef(table: string): TableDef | undefined {
  return DB_COLUMN_REGISTRY[table];
}

export function getColumnDef(table: string, column: string): ColumnDef | undefined {
  return DB_COLUMN_REGISTRY[table]?.columns[column];
}

export function isValidMapping(table: string, column: string): boolean {
  return !!getColumnDef(table, column);
}

export function getAllTableKeys(): string[] {
  return Object.keys(DB_COLUMN_REGISTRY);
}
