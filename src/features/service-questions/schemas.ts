import { z } from 'zod';
import { locales } from '@/lib/i18n/config';
import { QUESTION_TYPES } from './types';

const localeKey = z.enum(locales as unknown as [string, ...string[]]);

const i18nEntrySchema = z.object({
  label: z.string().optional(),
  placeholder: z.string().optional(),
  help: z.string().optional(),
});

const i18nSchema = z.record(localeKey, i18nEntrySchema);

const manualOptionSchema = z.object({
  value: z.string().min(1, 'Value required').regex(/^[a-z0-9_-]+$/i, 'Use letters, numbers, _ or -'),
  i18n: z.record(localeKey, z.object({ label: z.string().optional() })),
});

const fileConfigSchema = z.object({
  allowedTypes: z.array(z.string().min(1)).min(1, 'At least one MIME type required'),
  maxSizeMb: z.number().int().min(1).max(100),
});

const keySchema = z
  .string()
  .min(1, 'Key required')
  .max(60)
  .regex(/^[a-z][a-z0-9_]*$/, 'Key must be lowercase letters, digits or _ (start with a letter)');

export const questionSchema = z
  .object({
    key: keySchema,
    type: z.enum(QUESTION_TYPES),
    required: z.boolean(),
    i18n: i18nSchema,
    optionsSource: z.enum(['manual', 'subtype']).optional(),
    options: z.array(manualOptionSchema).optional(),
    subtypeGroupSlug: z.string().optional(),
    subtypeExcludedIds: z.array(z.string().uuid()).optional(),
    fileConfig: fileConfigSchema.optional(),
  })
  .superRefine((q, ctx) => {
    if (q.type === 'singleSelect' || q.type === 'multiSelect') {
      if (!q.optionsSource) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['optionsSource'],
          message: 'Required for select questions',
        });
        return;
      }
      if (q.optionsSource === 'manual' && (!q.options || q.options.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options'],
          message: 'At least one option required',
        });
      }
      if (q.optionsSource === 'subtype' && !q.subtypeGroupSlug) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['subtypeGroupSlug'],
          message: 'Choose a subtype group',
        });
      }
    }
    if (q.type === 'file' && !q.fileConfig) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fileConfig'],
        message: 'File config required',
      });
    }
  });

export const saveQuestionsSchema = z.object({
  serviceId: z.string().uuid(),
  questions: z
    .array(questionSchema)
    .superRefine((arr, ctx) => {
      const seen = new Set<string>();
      for (let i = 0; i < arr.length; i++) {
        const k = arr[i].key;
        if (seen.has(k)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [i, 'key'],
            message: `Duplicate key "${k}"`,
          });
        }
        seen.add(k);
      }
    }),
});

export type SaveQuestionsSchemaInput = z.input<typeof saveQuestionsSchema>;
