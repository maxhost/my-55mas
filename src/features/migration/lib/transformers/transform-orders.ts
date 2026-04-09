import type { ColumnMapping, RowError } from '../../types';

export type OrderLookups = {
  servicesByName: Map<string, string>;
  clientsByName: Map<string, string>;
  talentsByName: Map<string, string>;
  citiesByName: Map<string, string>;
  countryIdForPT: string | null;
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
};

const STATUS_MAP: Record<string, string> = {
  'aguarda especialista': 'buscando_talento',
  'em análise': 'nuevo',
  'análise': 'nuevo',
  'novo': 'nuevo',
  'completo': 'completado',
  'cancelado': 'cancelado',
  'em curso': 'en_curso',
  'aguarda pagamento serviço': 'asignado',
  'asignado': 'asignado',
};

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

export function transformOrders(
  rows: Record<string, string>[],
  mappings: ColumnMapping[],
  lookups: OrderLookups,
  startIndex: number
): { data: TransformedOrder[]; errors: RowError[] } {
  const data: TransformedOrder[] = [];
  const errors: RowError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const mapped = applyMapping(rows[i], mappings);
    const rowIndex = startIndex + i;

    if (!mapped.contact_name && !mapped.contact_email) {
      errors.push({ rowIndex, message: 'Client name or email is required' });
      continue;
    }

    // Lookup client by name
    const clientId = mapped.contact_name
      ? lookups.clientsByName.get(mapped.contact_name.toLowerCase())
      : undefined;

    if (!clientId) {
      errors.push({ rowIndex, message: `Client not found: "${mapped.contact_name}"` });
      continue;
    }

    // Lookup service by name (optional)
    const serviceId = mapped.service_name
      ? lookups.servicesByName.get(mapped.service_name.toLowerCase()) ?? null
      : null;

    // Lookup talent by name (optional)
    const talentId = mapped.talent_name
      ? lookups.talentsByName.get(mapped.talent_name.toLowerCase()) ?? null
      : null;

    // Lookup city (optional)
    const cityId = mapped.city
      ? lookups.citiesByName.get(mapped.city.toLowerCase()) ?? null
      : null;

    const countryId = lookups.countryIdForPT ?? '';
    if (!countryId) {
      errors.push({ rowIndex, message: 'Country ID for PT not available' });
      continue;
    }

    const status = mapped.status
      ? STATUS_MAP[mapped.status.toLowerCase()] ?? 'nuevo'
      : 'nuevo';

    const subtotal = parseNumber(mapped.price_subtotal);
    const taxRate = 23; // PT VAT
    const tax = subtotal * (taxRate / 100);
    const total = parseNumber(mapped.price_total) || subtotal + tax;

    const recurring = mapped.schedule_type?.toLowerCase();
    const scheduleType = recurring === 'sim' || recurring === 'yes' ? 'weekly' : 'once';

    data.push({
      client_id: clientId,
      service_id: serviceId,
      talent_id: talentId,
      country_id: countryId,
      service_city_id: cityId,
      contact_name: mapped.contact_name || '',
      contact_email: mapped.contact_email || '',
      contact_phone: mapped.contact_phone || '',
      form_data: {},
      status,
      price_subtotal: subtotal,
      price_tax_rate: taxRate,
      price_tax: tax,
      price_total: total,
      currency: 'EUR',
      schedule_type: scheduleType,
      created_at: mapped.created_at || null,
    });
  }

  return { data, errors };
}
