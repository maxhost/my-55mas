// ── DB-derived types ──────────────────────────────────

export type ServiceSubtype = {
  id: string;
  service_id: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
};

export type SubtypeTranslation = {
  subtype_id: string;
  locale: string;
  name: string;
};

// ── Composite types ──────────────────────────────────

export type SubtypeWithTranslations = ServiceSubtype & {
  translations: Record<string, string>; // locale → name
};

// ── Input types for save action ─────────────────────

export type SubtypeInput = {
  id?: string; // present for update, absent for create
  slug: string;
  sort_order: number;
  is_active: boolean;
  translations: Record<string, string>; // locale → name
};

export type SaveSubtypesInput = {
  service_id: string;
  subtypes: SubtypeInput[];
};
