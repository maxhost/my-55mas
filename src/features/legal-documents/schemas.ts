import { z } from 'zod';
import { lexicalStateSchema } from '@/shared/lib/lexical/types';
import { LEGAL_DOCUMENT_LOCALES, LEGAL_DOCUMENT_SLUGS } from './types';

const localeKeySchema = z.enum(LEGAL_DOCUMENT_LOCALES);

const translationSchema = z.object({
  lexicalState: lexicalStateSchema.nullable(),
  // Cap at ~200KB to avoid unbounded jsonb growth. Public render reads
  // this directly; oversized payloads hurt LCP.
  richHtml: z.string().max(200_000),
});

const translationsSchema = z.record(localeKeySchema, translationSchema);

export const saveLegalDocumentSchema = z.object({
  slug: z.enum(LEGAL_DOCUMENT_SLUGS),
  expectedUpdatedAt: z.string().min(1),
  translations: translationsSchema,
});

export type SaveLegalDocumentSchemaInput = z.input<
  typeof saveLegalDocumentSchema
>;
