'use server';

import type { DbColumn, MigrationTarget } from '../types';

const CLIENT_COLUMNS: DbColumn[] = [
  { name: 'full_name', required: true, description: 'Full name' },
  { name: 'email', required: true, description: 'Email address' },
  { name: 'phone', required: false, description: 'Phone number' },
  { name: 'preferred_contact', required: false, description: 'phone/whatsapp/email/messenger' },
  { name: 'nif', required: false, description: 'Tax ID (NIF/NIE)' },
  { name: 'company_name', required: false, description: 'Company name (if business)' },
  { name: 'is_business', required: false, description: 'Business client? (true/false)' },
  { name: 'legacy_id', required: false, description: 'Legacy system ID (Client #)' },
  { name: 'terms_accepted', required: false, description: 'Terms accepted? (yes/no)' },
  { name: 'billing_address', required: false, description: 'Billing street address' },
  { name: 'billing_state', required: false, description: 'Billing state/province' },
  { name: 'billing_postal_code', required: false, description: 'Billing postal code' },
  { name: 'gender', required: false, description: 'male/female' },
  { name: 'birth_date', required: false, description: 'Date of birth (YYYY-MM-DD)' },
  { name: 'city', required: false, description: 'City name (for lookup)' },
  { name: 'country', required: false, description: 'Country name (for lookup)' },
  { name: 'survey_question', required: false, description: 'Statistical question' },
  { name: 'created_at', required: false, description: 'Registration date' },
];

const TALENT_COLUMNS: DbColumn[] = [
  { name: 'full_name', required: true, description: 'Full name' },
  { name: 'email', required: true, description: 'Email address' },
  { name: 'birth_date', required: false, description: 'Date of birth (various formats supported)' },
  { name: 'phone', required: false, description: 'Phone number' },
  { name: 'preferred_contact', required: false, description: 'phone/whatsapp/email/messenger' },
  { name: 'gender', required: false, description: 'male/female' },
  { name: 'nif', required: false, description: 'Tax ID (NIF/NIE)' },
  { name: 'status', required: false, description: 'approved/pending/rejected/suspended' },
  { name: 'legacy_id', required: false, description: 'Legacy system ID (Specialist #)' },
  { name: 'terms_accepted', required: false, description: 'Terms accepted? (yes/no)' },
  { name: 'has_car', required: false, description: 'Has car (yes/no)' },
  { name: 'preferred_payment', required: false, description: 'Payment preference' },
  { name: 'professional_status', required: false, description: 'Professional status' },
  { name: 'address', required: false, description: 'Street address' },
  { name: 'state', required: false, description: 'State/province' },
  { name: 'postal_code', required: false, description: 'Postal code' },
  { name: 'city', required: false, description: 'City name (for lookup)' },
  { name: 'country', required: false, description: 'Country name (for lookup)' },
  { name: 'survey_question', required: false, description: 'Statistical question' },
  { name: 'service_column', required: false, description: 'Service offered (select service)' },
  { name: 'service_subtype_column', required: false, description: 'Service subtype (select group)' },
  { name: 'created_at', required: false, description: 'Registration date' },
];

const ORDER_COLUMNS: DbColumn[] = [
  { name: 'contact_name', required: true, description: 'Client name (for lookup)' },
  { name: 'contact_email', required: true, description: 'Client email' },
  { name: 'contact_phone', required: false, description: 'Client phone' },
  { name: 'service_name', required: false, description: 'Service name (for lookup)' },
  { name: 'talent_name', required: false, description: 'Talent name (for lookup)' },
  { name: 'city', required: false, description: 'City name (for lookup)' },
  { name: 'status', required: false, description: 'Order status' },
  { name: 'price_subtotal', required: false, description: 'Price before tax' },
  { name: 'price_total', required: false, description: 'Total price with tax' },
  { name: 'schedule_type', required: false, description: 'Recurring? (yes/no)' },
  { name: 'created_at', required: false, description: 'Order date' },
];

const COLUMNS_MAP: Record<MigrationTarget, DbColumn[]> = {
  clients: CLIENT_COLUMNS,
  talents: TALENT_COLUMNS,
  orders: ORDER_COLUMNS,
};

export async function getTableColumns(
  target: MigrationTarget
): Promise<DbColumn[]> {
  return COLUMNS_MAP[target] ?? [];
}
