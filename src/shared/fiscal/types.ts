export type FiscalValidationResult =
  | { ok: true }
  | { ok: false; reason: 'empty' | 'format' };

export type BillingPartyData = {
  name: string;
  phone: string;
  fiscal_id_type_id: string;
  fiscal_id: string;
};

export type BillingChoice =
  | { mode: 'same' }
  | { mode: 'custom'; data: BillingPartyData };
