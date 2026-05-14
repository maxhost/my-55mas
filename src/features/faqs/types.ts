import { locales } from '@/lib/i18n/config';

export const FAQ_LOCALES = locales;
export type FaqLocale = (typeof FAQ_LOCALES)[number];

export type FaqTranslation = { question: string; answer: string };

export type Faq = {
  id: string;
  sort_order: number;
  is_active: boolean;
};

export type FaqWithTranslations = Faq & {
  translations: Record<string, FaqTranslation>;
};

export type FaqInput = {
  id?: string;
  sort_order: number;
  is_active: boolean;
  translations: Record<string, FaqTranslation>;
};

export type SaveFaqInput = { faq: FaqInput };
