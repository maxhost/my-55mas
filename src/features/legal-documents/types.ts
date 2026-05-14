import { locales } from '@/lib/i18n/config';
import type { LexicalState } from '@/shared/lib/lexical/types';

export const LEGAL_DOCUMENT_SLUGS = [
  'terms',
  'privacy',
  'terms_of_use',
  'transparency',
] as const;

export type LegalDocumentSlug = (typeof LEGAL_DOCUMENT_SLUGS)[number];

export const LEGAL_DOCUMENT_LOCALES = locales;
export type LegalDocumentLocale = (typeof LEGAL_DOCUMENT_LOCALES)[number];

export type LegalDocumentTranslation = {
  lexicalState: LexicalState | null;
  richHtml: string;
};

export type LegalDocument = {
  id: string;
  slug: LegalDocumentSlug;
  updated_at: string;
  translations: Record<string, LegalDocumentTranslation>;
};

export type SaveLegalDocumentInput = {
  slug: LegalDocumentSlug;
  /** ISO timestamp from the initial fetch — used for optimistic locking. */
  expectedUpdatedAt: string;
  translations: Record<string, LegalDocumentTranslation>;
};

export type SaveLegalDocumentSuccess = { updated_at: string };

export type SaveLegalDocumentError =
  | 'invalid-input'
  | 'not-found'
  | 'optimistic-lock'
  | 'db-failed';
