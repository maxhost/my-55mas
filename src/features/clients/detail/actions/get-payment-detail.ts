'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { I18nRecord } from '@/shared/lib/json';
import type {
  ClientPaymentDetail,
  ClientPaymentItem,
  ClientPaymentStatus,
} from '../types';

const PROOF_BUCKET = 'client-payment-proofs';
const PROOF_SIGNED_URL_TTL_SEC = 60 * 10;

/**
 * Loads a single client_payment with its items + joined order/service info.
 * If `payment_proof_url` is a path inside the `client-payment-proofs`
 * private bucket, returns a short-lived signed URL the admin can click. If
 * it's an external URL (legacy / external billing system), passes through.
 */
export async function getPaymentDetail(
  paymentId: string,
  locale: string,
): Promise<ClientPaymentDetail | null> {
  const supabase = createClient();

  const { data: payment } = await supabase
    .from('client_payments')
    .select(
      'id, period_month, status, total_amount, currency, payment_method, payment_proof_url, paid_at, notes, created_at',
    )
    .eq('id', paymentId)
    .maybeSingle();
  if (!payment) return null;

  const { data: itemRows } = await supabase
    .from('client_payment_items')
    .select('id, order_id, total, notes')
    .eq('payment_id', paymentId);

  const orderIds = (itemRows ?? []).map((r) => r.order_id);
  const orders =
    orderIds.length > 0
      ? (await supabase
          .from('orders')
          .select('id, order_number, appointment_date, timezone, service_id')
          .in('id', orderIds)).data ?? []
      : [];

  const serviceIds = Array.from(
    new Set(orders.map((o) => o.service_id).filter((s): s is string => !!s)),
  );
  const services =
    serviceIds.length > 0
      ? (await supabase.from('services').select('id, slug, i18n').in('id', serviceIds)).data ?? []
      : [];
  const serviceNames = new Map<string, string>(
    services.map((s) => [s.id, localizedField(s.i18n as I18nRecord, locale, 'name') ?? s.slug]),
  );

  const orderMap = new Map(
    orders.map((o) => [
      o.id,
      {
        order_number: o.order_number,
        appointment_date: o.appointment_date,
        timezone: o.timezone,
        service_name: o.service_id ? serviceNames.get(o.service_id) ?? null : null,
      },
    ]),
  );

  const items: ClientPaymentItem[] = (itemRows ?? []).map((it) => {
    const order = orderMap.get(it.order_id);
    return {
      id: it.id,
      order_id: it.order_id,
      order_number: order?.order_number ?? 0,
      appointment_date: order?.appointment_date ?? null,
      timezone: order?.timezone ?? 'Europe/Madrid',
      service_name: order?.service_name ?? null,
      total: Number(it.total),
      notes: it.notes,
    };
  });

  let proofSignedUrl: string | null = null;
  if (payment.payment_proof_url) {
    proofSignedUrl = await resolveProofUrl(supabase, payment.payment_proof_url);
  }

  return {
    id: payment.id,
    period_month: payment.period_month,
    status: payment.status as ClientPaymentStatus,
    total_amount: Number(payment.total_amount),
    currency: payment.currency,
    payment_method: payment.payment_method,
    payment_proof_url: payment.payment_proof_url,
    paid_at: payment.paid_at,
    notes: payment.notes,
    created_at: payment.created_at,
    items,
    proof_signed_url: proofSignedUrl,
  };
}

/**
 * If the stored URL is an absolute http(s) URL we hand it back unchanged
 * (external billing system / legacy data). If it looks like a Supabase
 * Storage path inside our private bucket, sign it.
 */
async function resolveProofUrl(
  supabase: ReturnType<typeof createClient>,
  stored: string,
): Promise<string | null> {
  if (/^https?:\/\//i.test(stored)) return stored;
  const path = extractStoragePath(stored);
  if (!path) return null;
  const { data: signed } = await supabase.storage
    .from(PROOF_BUCKET)
    .createSignedUrl(path, PROOF_SIGNED_URL_TTL_SEC);
  return signed?.signedUrl ?? null;
}

function extractStoragePath(stored: string): string | null {
  if (!stored) return null;
  const marker = `/${PROOF_BUCKET}/`;
  const idx = stored.indexOf(marker);
  if (idx !== -1) return stored.substring(idx + marker.length);
  return stored.replace(/^\/+/, '');
}
