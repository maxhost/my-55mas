// ── Types ────────────────────────────────────────────

export type InputType =
  | 'text'
  | 'email'
  | 'date'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'textarea'
  | 'password'
  | 'address';

export type OptionsSource = 'spoken_languages';

// Shape de una opción en el registry:
// - forma corta string: 'male' (convención camelCase `${col}_${value}` para resolver label)
// - forma explícita {value, labelKey}: para garantizar binding al message
export type ColumnOption = { value: string; labelKey?: string };

export type ColumnDef = {
  inputType: InputType;
  labelKey: string;
  options?: readonly string[] | readonly ColumnOption[];
  optionsSource?: OptionsSource;
};

// Normaliza ambas shapes de options a ColumnOption[] (siempre con value).
export function normalizeColumnOptions(
  options:
    | readonly string[]
    | readonly ColumnOption[]
    | undefined
): ColumnOption[] {
  if (!options || options.length === 0) return [];
  if (typeof options[0] === 'string') {
    return (options as readonly string[]).map((value) => ({ value }));
  }
  return [...(options as readonly ColumnOption[])];
}

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
      address: { inputType: 'address', labelKey: 'DbColumns.address' },
      preferred_contact: {
        inputType: 'select',
        labelKey: 'DbColumns.preferredContact',
        options: [
          { value: 'email', labelKey: 'DbColumnOptions.preferredContact_email' },
          { value: 'phone', labelKey: 'DbColumnOptions.preferredContact_phone' },
          { value: 'whatsapp', labelKey: 'DbColumnOptions.preferredContact_whatsapp' },
        ],
      },
      birth_date: { inputType: 'date', labelKey: 'DbColumns.birthDate' },
      gender: {
        inputType: 'select',
        labelKey: 'DbColumns.gender',
        options: [
          { value: 'male', labelKey: 'DbColumnOptions.gender_male' },
          { value: 'female', labelKey: 'DbColumnOptions.gender_female' },
          { value: 'other', labelKey: 'DbColumnOptions.gender_other' },
          { value: 'prefer_not_to_say', labelKey: 'DbColumnOptions.gender_prefer_not_to_say' },
        ],
      },
      other_language: {
        inputType: 'multiselect',
        labelKey: 'DbColumns.otherLanguage',
        optionsSource: 'spoken_languages',
      },
    },
  },
  talent_profiles: {
    labelKey: 'DbTables.talentProfiles',
    columns: {
      has_car: { inputType: 'boolean', labelKey: 'DbColumns.hasCar' },
      preferred_payment: {
        inputType: 'select',
        labelKey: 'DbColumns.preferredPayment',
        options: [
          { value: 'bank_transfer', labelKey: 'DbColumnOptions.preferredPayment_bank_transfer' },
          { value: 'cash', labelKey: 'DbColumnOptions.preferredPayment_cash' },
          { value: 'paypal', labelKey: 'DbColumnOptions.preferredPayment_paypal' },
        ],
      },
      professional_status: {
        inputType: 'select',
        labelKey: 'DbColumns.professionalStatus',
        options: [
          { value: 'employed', labelKey: 'DbColumnOptions.professionalStatus_employed' },
          { value: 'retired', labelKey: 'DbColumnOptions.professionalStatus_retired' },
          { value: 'freelance', labelKey: 'DbColumnOptions.professionalStatus_freelance' },
          { value: 'unemployed', labelKey: 'DbColumnOptions.professionalStatus_unemployed' },
        ],
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
