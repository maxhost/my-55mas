export const TALENT_TAG_LOCALES = ['es', 'en', 'pt', 'fr', 'ca'] as const;
export type TalentTagLocale = (typeof TALENT_TAG_LOCALES)[number];

export type TalentTag = {
  id: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
};

export type TalentTagTranslation = {
  tag_id: string;
  locale: string;
  name: string;
};

export type TalentTagWithTranslations = TalentTag & {
  translations: Record<string, string>;
};

export type TalentTagInput = {
  id?: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  translations: Record<string, string>;
};

export type SaveTalentTagInput = {
  tag: TalentTagInput;
};

export type TalentTagAssignmentRow = {
  talent_id: string;
  tag_id: string;
  assigned_by: string | null;
  created_at: string;
};
