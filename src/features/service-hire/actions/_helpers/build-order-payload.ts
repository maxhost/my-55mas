import type { Json } from '@/lib/supabase/database.types';
import { INITIAL_ORDER_STATUS } from '@/shared/lib/domain-defaults';
import type { BillingChoiceInput } from '@/shared/fiscal/schemas';

export type OrderContact = {
  name: string;
  email: string;
  phone: string;
  fiscal_id_type_id: string | null;
  fiscal_id: string | null;
};

export type BuildOrderPayloadArgs = {
  userId: string;
  serviceId: string;
  countryId: string;
  serviceCityId: string | null;
  serviceAddress: string;
  servicePostalCode: string | null;
  scheduleType: 'once' | 'recurring';
  appointmentDate: string | null;
  timezone: string;
  contact: OrderContact;
  billing: BillingChoiceInput | undefined;
  notes: string | null;
  answers: Json;
};

// Pure transform: takes resolved inputs and produces the row to INSERT into
// orders. Centralizing this keeps submit-service-hire focused on orchestration
// and lets us unit-test the payload shape without touching Supabase.
export function buildOrderPayload(args: BuildOrderPayloadArgs) {
  return {
    client_id: args.userId,
    service_id: args.serviceId,
    country_id: args.countryId,
    service_city_id: args.serviceCityId,
    service_address: args.serviceAddress,
    service_postal_code: args.servicePostalCode,
    schedule_type: args.scheduleType,
    appointment_date: args.appointmentDate,
    timezone: args.timezone,
    contact_name: args.contact.name,
    contact_email: args.contact.email,
    contact_phone: args.contact.phone,
    contact_fiscal_id_type_id: args.contact.fiscal_id_type_id,
    contact_fiscal_id: args.contact.fiscal_id,
    billing_override:
      args.billing && args.billing.mode === 'custom'
        ? (args.billing.data as unknown as Json)
        : null,
    notes: args.notes,
    status: INITIAL_ORDER_STATUS,
    payment_status: 'pending',
    price_subtotal: 0,
    price_tax_rate: 0,
    price_tax: 0,
    price_total: 0,
    currency: 'EUR',
    form_data: args.answers,
  };
}
