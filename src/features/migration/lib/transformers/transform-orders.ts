import type { ColumnMapping, RowError } from '../../types';

export type OrderLookups = {
  servicesByName: Map<string, string>;
  clientsByName: Map<string, string>;
  talentsByName: Map<string, string>;
  citiesByName: Map<string, string>;
  staffByName: Map<string, string>;
  defaultCountryId: string | null;
};

export type TransformedOrder = {
  client_id: string;
  service_id: string | null;
  talent_id: string | null;
  country_id: string;
  service_city_id: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  form_data: Record<string, string>;
  status: string;
  price_subtotal: number;
  price_tax_rate: number;
  price_tax: number;
  price_total: number;
  currency: string;
  schedule_type: string;
  created_at: string | null;
  legacy_id: string | null;
  talent_amount: number | null;
  staff_member_id: string | null;
  appointment_date: string | null;
  service_state: string | null;
  unit_price: number | null;
  specialist_unit_price: number | null;
  quantity: number | null;
  discount: number | null;
  payment_status: string | null;
  rating: number | null;
  stripe_id: string | null;
  legacy_data: Record<string, string> | null;
};

const STATUS_MAP: Record<string, string> = {
  'aguarda especialista': 'buscando_talento',
  'em análise': 'nuevo',
  'em analise': 'nuevo',
  'análise': 'nuevo',
  'analise': 'nuevo',
  'novo': 'nuevo',
  'completo': 'completado',
  'cancelado': 'cancelado',
  'em curso': 'en_curso',
  'aguarda pagamento serviço': 'asignado',
  'aguarda pagamento servico': 'asignado',
  'asignado': 'asignado',
  'aguarda conclusão': 'en_curso',
  'aguarda conclusao': 'en_curso',
  'fechado': 'completado',
  // ES statuses
  'rechazado': 'cancelado',
  'pendiente de pago': 'asignado',
  'pendiente': 'nuevo',
  'terminado': 'completado',
  'completado': 'completado',
};

const PT_TAX_RATE = 23;

/**
 * Lowercase + strip diacritics + collapse whitespace + trim.
 * Used on both sides of every lookup (map key + query) to make name
 * matching resilient to double-spaces, trailing whitespace and accents.
 */
export function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function applyMapping(
  row: Record<string, string>,
  mappings: ColumnMapping[]
): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const m of mappings) {
    if (m.dbColumn && row[m.csvColumn] !== undefined) {
      mapped[m.dbColumn] = row[m.csvColumn].trim();
    }
  }
  return mapped;
}

function parseNumber(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(',', '.');
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

function lookup(
  map: Map<string, string>,
  name: string | undefined
): string | null {
  if (!name) return null;
  return map.get(normalizeName(name)) ?? null;
}

function resolveStatus(raw: string | undefined): string {
  if (!raw) return 'nuevo';
  return STATUS_MAP[normalizeName(raw)] ?? 'nuevo';
}

function resolveScheduleType(raw: string | undefined): string {
  const v = raw?.toLowerCase().trim();
  return v === 'sim' || v === 'yes' ? 'weekly' : 'once';
}

function resolvePricing(mapped: Record<string, string>): {
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
} {
  const rawSubtotal = parseNumber(mapped.price_subtotal);
  const rawTotal = parseNumber(mapped.price_total);
  // Fallback: when only the VAT-inclusive total is mapped, derive the subtotal
  // by backing out the tax so price_total = subtotal + tax keeps holding.
  const subtotal =
    rawSubtotal || (rawTotal ? rawTotal / (1 + PT_TAX_RATE / 100) : 0);
  const tax = subtotal * (PT_TAX_RATE / 100);
  const total = rawTotal || subtotal + tax;
  return { subtotal, taxRate: PT_TAX_RATE, tax, total };
}

function buildLegacyData(
  row: Record<string, string>,
  mappings: ColumnMapping[]
): Record<string, string> | null {
  const mappedCsvColumns = new Set(
    mappings.filter((m) => m.dbColumn).map((m) => m.csvColumn)
  );
  const out: Record<string, string> = {};
  for (const [csvCol, value] of Object.entries(row)) {
    if (mappedCsvColumns.has(csvCol)) continue;
    if (value === undefined || value === null || value === '') continue;
    out[csvCol] = value;
  }
  return Object.keys(out).length > 0 ? out : null;
}

function parseOptionalNumber(val: string | undefined): number | null {
  if (!val) return null;
  const cleaned = val.replace(',', '.');
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? null : num;
}

function parseDate(val: string | undefined): string | null {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function resolvePaymentStatus(val: string | undefined): string | null {
  if (!val) return null;
  const v = val.toLowerCase().trim();
  if (v === 'yes' || v === 'sim' || v === 'si' || v === 'sí') return 'paid';
  if (v === 'no' || v === 'não' || v === 'nao') return 'unpaid';
  return null;
}

function parseRating(val: string | undefined): number | null {
  if (!val) return null;
  const num = parseInt(val, 10);
  if (Number.isNaN(num) || num < 1 || num > 5) return null;
  return num;
}

type LookupResult =
  | { ok: true; clientId: string; serviceId: string | null; talentId: string | null; cityId: string | null }
  | { ok: false; message: string };

function resolveLookups(
  mapped: Record<string, string>,
  lookups: OrderLookups
): LookupResult {
  if (!mapped.contact_name && !mapped.contact_email) {
    return { ok: false, message: 'Client name or email is required' };
  }
  const clientId = lookup(lookups.clientsByName, mapped.contact_name);
  if (!clientId) {
    return { ok: false, message: `Client not found: "${mapped.contact_name}"` };
  }
  return {
    ok: true,
    clientId,
    serviceId: lookup(lookups.servicesByName, mapped.service_name),
    talentId: lookup(lookups.talentsByName, mapped.talent_name),
    cityId: lookup(lookups.citiesByName, mapped.city),
  };
}

export function transformOrders(
  rows: Record<string, string>[],
  mappings: ColumnMapping[],
  lookups: OrderLookups,
  startIndex: number
): { data: TransformedOrder[]; errors: RowError[] } {
  const data: TransformedOrder[] = [];
  const errors: RowError[] = [];
  const countryId = lookups.defaultCountryId ?? '';

  for (let i = 0; i < rows.length; i++) {
    const rowIndex = startIndex + i;
    const mapped = applyMapping(rows[i], mappings);

    if (!countryId) {
      errors.push({ rowIndex, message: 'Default country ID not available' });
      continue;
    }

    const resolved = resolveLookups(mapped, lookups);
    if (!resolved.ok) {
      errors.push({ rowIndex, message: resolved.message });
      continue;
    }

    const pricing = resolvePricing(mapped);

    data.push({
      client_id: resolved.clientId,
      service_id: resolved.serviceId,
      talent_id: resolved.talentId,
      country_id: countryId,
      service_city_id: resolved.cityId,
      contact_name: mapped.contact_name || '',
      contact_email: mapped.contact_email || '',
      contact_phone: mapped.contact_phone || '',
      form_data: {},
      status: resolveStatus(mapped.status),
      price_subtotal: pricing.subtotal,
      price_tax_rate: pricing.taxRate,
      price_tax: pricing.tax,
      price_total: pricing.total,
      currency: 'EUR',
      schedule_type: resolveScheduleType(mapped.schedule_type),
      created_at: mapped.created_at || null,
      legacy_id: mapped.legacy_id || null,
      talent_amount: parseOptionalNumber(mapped.talent_amount),
      staff_member_id: lookup(lookups.staffByName, mapped.staff_member_name),
      appointment_date: parseDate(mapped.appointment_date),
      service_state: mapped.service_state || null,
      unit_price: parseOptionalNumber(mapped.unit_price),
      specialist_unit_price: parseOptionalNumber(mapped.specialist_unit_price),
      quantity: parseOptionalNumber(mapped.quantity),
      discount: parseOptionalNumber(mapped.discount),
      payment_status: resolvePaymentStatus(mapped.payment_status),
      rating: parseRating(mapped.rating),
      stripe_id: mapped.stripe_id || null,
      legacy_data: buildLegacyData(rows[i], mappings),
    });
  }

  return { data, errors };
}
