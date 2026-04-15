export const SPOKEN_LANGUAGE_LOCALES = ['es', 'en', 'pt', 'fr', 'ca'] as const;
export type SpokenLanguageLocale = (typeof SPOKEN_LANGUAGE_LOCALES)[number];

export type SpokenLanguageTranslations = Record<SpokenLanguageLocale, string>;

export type SpokenLanguageWithTranslations = {
  code: string;
  sort_order: number;
  is_active: boolean;
  translations: SpokenLanguageTranslations;
};

export type SpokenLanguageInput = {
  code: string;
  sort_order: number;
  is_active: boolean;
  translations: SpokenLanguageTranslations;
  creating: boolean;
};

export type SaveSpokenLanguageInput = {
  language: SpokenLanguageInput;
};

export type SaveSpokenLanguageResult =
  | { data: { code: string } }
  | { error: Record<string, string[]> };

export type DeleteSpokenLanguageResult =
  | { data: { code: string } }
  | { error: Record<string, string[]> };

export type ListSpokenLanguagesResult =
  | { ok: true; data: SpokenLanguageWithTranslations[] }
  | { ok: false; error: string };
