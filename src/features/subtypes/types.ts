// ── DB-derived types: Groups ─────────────────────────

export type SubtypeGroup = {
  id: string;
  service_id: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
};

export type SubtypeGroupTranslation = {
  group_id: string;
  locale: string;
  name: string;
};

export type SubtypeGroupWithTranslations = SubtypeGroup & {
  translations: Record<string, string>; // locale → name
  items: SubtypeItemWithTranslations[];
};

// ── DB-derived types: Items (formerly ServiceSubtype) ─

export type SubtypeItem = {
  id: string;
  group_id: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
};

export type SubtypeItemTranslation = {
  subtype_id: string;
  locale: string;
  name: string;
};

export type SubtypeItemWithTranslations = SubtypeItem & {
  translations: Record<string, string>; // locale → name
};

// ── Input types for save action ─────────────────────

export type SubtypeItemInput = {
  id?: string; // present for update, absent for create
  slug: string;
  sort_order: number;
  is_active: boolean;
  translations: Record<string, string>; // locale → name
};

export type SubtypeGroupInput = {
  id?: string; // present for update, absent for create
  slug: string;
  sort_order: number;
  is_active: boolean;
  translations: Record<string, string>; // locale → name
  items: SubtypeItemInput[];
};

export type SaveSubtypeGroupsInput = {
  service_id: string;
  groups: SubtypeGroupInput[];
};
