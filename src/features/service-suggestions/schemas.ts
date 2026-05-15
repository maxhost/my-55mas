import { z } from 'zod';
import { locales } from '@/lib/i18n/config';

export const suggestionSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  serviceNeeded: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(160),
  countryId: z.string().uuid(),
  cityId: z.string().uuid(),
  comments: z.string().trim().max(2000).default(''),
  locale: z.enum(locales),
  // Anti-spam: honeypot must be empty; a human can't fill 6 fields
  // in under 2.5s; a token older than 1h is stale/forged.
  honeypot: z.string().max(0),
  elapsedMs: z
    .number()
    .int()
    .min(2500)
    .max(1000 * 60 * 60),
});

export type SuggestionSchemaInput = z.input<typeof suggestionSchema>;
