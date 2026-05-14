import { locales } from '@/lib/i18n/config';

export const REVIEW_LOCALES = locales;
export type ReviewLocale = (typeof REVIEW_LOCALES)[number];

export type Review = {
  id: string;
  author_name: string;
  author_photo: string | null;
  stars: number;
  sort_order: number;
  is_active: boolean;
};

export type ReviewWithTranslations = Review & {
  /** Per-locale review body text. `{ es: '...', en: '...', ... }`. */
  translations: Record<string, string>;
};

export type ReviewInput = {
  id?: string;
  author_name: string;
  author_photo: string | null;
  stars: number;
  sort_order: number;
  is_active: boolean;
  translations: Record<string, string>;
};

export type SaveReviewInput = { review: ReviewInput };
