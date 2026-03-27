import { z } from 'zod';
import { RESPONSE_TYPES } from './types';

const keySchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-z][a-z0-9_]*$/, 'Key must be snake_case starting with a letter');

const translationSchema = z.object({
  label: z.string().min(1),
  description: z.string().optional(),
  option_labels: z.record(z.string()).optional(),
});

export const surveyQuestionInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    key: keySchema,
    response_type: z.enum(RESPONSE_TYPES),
    options: z.array(z.string().min(1)).nullable(),
    sort_order: z.number().int().min(0),
    is_active: z.boolean(),
    translations: z.record(translationSchema),
  })
  .superRefine((data, ctx) => {
    if (data.response_type === 'single_select') {
      if (!data.options || data.options.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Options required for single_select',
          path: ['options'],
        });
      }
    }
  });

export const saveSurveyQuestionsSchema = z.object({
  questions: z.array(surveyQuestionInputSchema),
});

export type SaveSurveyQuestionsSchemaInput = z.input<typeof saveSurveyQuestionsSchema>;
