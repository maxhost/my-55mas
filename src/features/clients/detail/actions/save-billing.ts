'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { saveBillingSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

/**
 * Updates the billing-related columns on `client_profiles`:
 * fiscal_id_type_id, company_tax_id, billing_address, billing_state,
 * billing_postal_code.
 */
export async function saveClientBilling(input: unknown): Promise<Result> {
  const supabase = createClient();

  const parsed = saveBillingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const {
    clientId,
    fiscal_id_type_id,
    company_tax_id,
    billing_address,
    billing_state,
    billing_postal_code,
  } = parsed.data;

  const { error } = await supabase
    .from('client_profiles')
    .update({
      fiscal_id_type_id,
      company_tax_id,
      billing_address,
      billing_state,
      billing_postal_code,
    })
    .eq('id', clientId);
  if (error) return { error: { message: error.message } };

  revalidatePath('/[locale]/(admin)/admin/clients/[id]', 'page');
  return { data: { ok: true } };
}
