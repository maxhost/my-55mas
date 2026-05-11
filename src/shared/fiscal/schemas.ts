import { z } from 'zod';

const trimmedString = (max: number) => z.string().trim().min(1).max(max);

export const billingPartyDataSchema = z.object({
  name: trimmedString(200),
  phone: trimmedString(40),
  fiscal_id_type_id: z.string().uuid(),
  fiscal_id: trimmedString(64),
});

// Discriminated union: `same` = invoice with contact data, `custom` = use
// the embedded billing party. Consumers should pass this into orders as
// `billing_override = mode === 'custom' ? data : null`.
export const billingChoiceSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('same') }),
  z.object({ mode: z.literal('custom'), data: billingPartyDataSchema }),
]);

export type BillingPartyDataInput = z.infer<typeof billingPartyDataSchema>;
export type BillingChoiceInput = z.infer<typeof billingChoiceSchema>;
