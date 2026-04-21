import { describe, it, expect } from 'vitest';
import { transformOrders } from '../lib/transformers/transform-orders';
import type { OrderLookups } from '../lib/transformers/transform-orders';
import type { ColumnMapping } from '../types';

const mappings: ColumnMapping[] = [
  { csvColumn: 'Client Name', dbColumn: 'contact_name' },
  { csvColumn: 'Client Email', dbColumn: 'contact_email' },
  { csvColumn: 'Service Name', dbColumn: 'service_name' },
  { csvColumn: 'Specialist', dbColumn: 'talent_name' },
  { csvColumn: 'City', dbColumn: 'city' },
  { csvColumn: 'Status', dbColumn: 'status' },
  { csvColumn: 'Recurring', dbColumn: 'schedule_type' },
  { csvColumn: 'Total Price (w/ Discount)', dbColumn: 'price_subtotal' },
  { csvColumn: 'Billed Price', dbColumn: 'price_total' },
  { csvColumn: 'Created At', dbColumn: 'created_at' },
];

function makeLookups(): OrderLookups {
  return {
    servicesByName: new Map([['bricolage', 'svc-1']]),
    clientsByName: new Map([
      ['fundacao antonio aleixo', 'cli-1'],
      ['carlos alberto gouveia', 'cli-2'],
      ['fatima valentim', 'cli-3'],
    ]),
    talentsByName: new Map([
      ['joana alves', 'tal-1'],
      ['solange sclipet', 'tal-2'],
    ]),
    citiesByName: new Map([['loule', 'city-1']]),
    staffByName: new Map([
      ['elena parras', 'staff-1'],
      ['joana alves', 'staff-2'],
    ]),
    defaultCountryId: 'country-pt',
  };
}

function baseRow(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    'Client Name': 'Fundação António Aleixo',
    'Client Email': 'algarve+faa@55mais.pt',
    'Service Name': 'Bricolage',
    'Specialist': 'Joana Alves',
    'City': 'Loulé',
    'Status': 'Aguarda Especialista',
    'Recurring': 'Não',
    'Total Price (w/ Discount)': '20.0',
    'Billed Price': '24.6',
    'Created At': '2025-10-01',
    ...overrides,
  };
}

describe('transformOrders — happy path', () => {
  it('transforms a valid row with all lookups resolved', () => {
    const { data, errors } = transformOrders([baseRow()], mappings, makeLookups(), 0);

    expect(errors).toEqual([]);
    expect(data).toHaveLength(1);
    const row = data[0];
    expect(row.client_id).toBe('cli-1');
    expect(row.service_id).toBe('svc-1');
    expect(row.talent_id).toBe('tal-1');
    expect(row.service_city_id).toBe('city-1');
    expect(row.country_id).toBe('country-pt');
    expect(row.status).toBe('buscando_talento');
    expect(row.price_subtotal).toBeCloseTo(20.0, 2);
    expect(row.price_tax_rate).toBe(23);
    expect(row.price_tax).toBeCloseTo(4.6, 2);
    expect(row.price_total).toBeCloseTo(24.6, 2);
    expect(row.schedule_type).toBe('once');
    expect(row.currency).toBe('EUR');
    expect(row.created_at).toBe('2025-10-01');
  });
});

describe('transformOrders — name normalization (whitespace + accents)', () => {
  it('matches client name with double spaces and trailing whitespace', () => {
    const { data, errors } = transformOrders(
      [baseRow({ 'Client Name': '  Carlos  Alberto Gouveia  ' })],
      mappings,
      makeLookups(),
      0
    );
    expect(errors).toEqual([]);
    expect(data[0].client_id).toBe('cli-2');
  });

  it('matches client name with accents stripped', () => {
    const { data, errors } = transformOrders(
      [baseRow({ 'Client Name': 'Fátima Valentim' })],
      mappings,
      makeLookups(),
      0
    );
    expect(errors).toEqual([]);
    expect(data[0].client_id).toBe('cli-3');
  });

  it('matches talent name with double spaces', () => {
    const { data, errors } = transformOrders(
      [baseRow({ 'Specialist': 'Solange  Sclipet ' })],
      mappings,
      makeLookups(),
      0
    );
    expect(errors).toEqual([]);
    expect(data[0].talent_id).toBe('tal-2');
  });
});

describe('transformOrders — status mapping', () => {
  it('maps "Fechado" → completado', () => {
    const { data } = transformOrders(
      [baseRow({ 'Status': 'Fechado' })],
      mappings,
      makeLookups(),
      0
    );
    expect(data[0].status).toBe('completado');
  });

  it('maps "Aguarda Conclusão" → en_curso (with accent)', () => {
    const { data } = transformOrders(
      [baseRow({ 'Status': 'Aguarda Conclusão' })],
      mappings,
      makeLookups(),
      0
    );
    expect(data[0].status).toBe('en_curso');
  });

  it('maps "Aguarda Conclusao" → en_curso (without accent)', () => {
    const { data } = transformOrders(
      [baseRow({ 'Status': 'Aguarda Conclusao' })],
      mappings,
      makeLookups(),
      0
    );
    expect(data[0].status).toBe('en_curso');
  });

  it('maps "Completo" → completado', () => {
    const { data } = transformOrders(
      [baseRow({ 'Status': 'Completo' })],
      mappings,
      makeLookups(),
      0
    );
    expect(data[0].status).toBe('completado');
  });

  it('falls back to "nuevo" for unknown status', () => {
    const { data } = transformOrders(
      [baseRow({ 'Status': 'Something Else' })],
      mappings,
      makeLookups(),
      0
    );
    expect(data[0].status).toBe('nuevo');
  });
});

describe('transformOrders — schedule_type', () => {
  it('maps Recurring=Sim → weekly', () => {
    const { data } = transformOrders(
      [baseRow({ 'Recurring': 'Sim' })],
      mappings,
      makeLookups(),
      0
    );
    expect(data[0].schedule_type).toBe('weekly');
  });

  it('maps Recurring=Não → once', () => {
    const { data } = transformOrders(
      [baseRow({ 'Recurring': 'Não' })],
      mappings,
      makeLookups(),
      0
    );
    expect(data[0].schedule_type).toBe('once');
  });
});

describe('transformOrders — legacy fields and full-CSV capture', () => {
  const mappingsWithLegacy: ColumnMapping[] = [
    ...mappings,
    { csvColumn: 'Appointment #', dbColumn: 'legacy_id' },
    { csvColumn: 'Specialist Amount', dbColumn: 'talent_amount' },
  ];

  function rowWithExtras(
    overrides: Record<string, string> = {}
  ): Record<string, string> {
    return {
      ...baseRow(),
      'Appointment #': '12230',
      'Specialist Amount': '14.00',
      'Rating': '5',
      'Feedback': 'Excellent',
      'Stripe Id': 'pi_abc123',
      'Appointment Date': '2026-04-06',
      'Month': '4',
      'Year': '2026',
      'Client Type': 'Individual',
      '55+ Member': 'Joana Alves',
      'Specialist Email': 'joana@55mais.pt',
      'State/Province': 'Quarteira',
      'Service Type': 'Standard',
      'Unit Price': '20.0',
      'Specialist U.P.': '14.0',
      'Quantity': '1.0',
      'Discount %': '0',
      'Total Price': '20.0',
      'Client Payed': 'Não',
      ...overrides,
    };
  }

  it('propagates legacy_id and talent_amount when mapped', () => {
    const { data, errors } = transformOrders(
      [rowWithExtras()],
      mappingsWithLegacy,
      makeLookups(),
      0
    );
    expect(errors).toEqual([]);
    expect(data[0].legacy_id).toBe('12230');
    expect(data[0].talent_amount).toBeCloseTo(14.0, 2);
  });

  it('captures unmapped CSV columns into legacy_data verbatim', () => {
    const { data } = transformOrders(
      [rowWithExtras()],
      mappingsWithLegacy,
      makeLookups(),
      0
    );
    const legacy = data[0].legacy_data;
    expect(legacy).not.toBeNull();
    expect(legacy).toMatchObject({
      Rating: '5',
      Feedback: 'Excellent',
      'Stripe Id': 'pi_abc123',
      'Appointment Date': '2026-04-06',
      Month: '4',
      Year: '2026',
      'Client Type': 'Individual',
      '55+ Member': 'Joana Alves',
      'Specialist Email': 'joana@55mais.pt',
      'State/Province': 'Quarteira',
      'Service Type': 'Standard',
      'Unit Price': '20.0',
      'Specialist U.P.': '14.0',
      Quantity: '1.0',
      'Discount %': '0',
      'Total Price': '20.0',
      'Client Payed': 'Não',
    });
  });

  it('returns legacy_data=null when all CSV columns are mapped', () => {
    const { data } = transformOrders([baseRow()], mappings, makeLookups(), 0);
    expect(data[0].legacy_data).toBeNull();
  });

  it('returns legacy_id=null and talent_amount=null when not mapped', () => {
    const { data } = transformOrders([baseRow()], mappings, makeLookups(), 0);
    expect(data[0].legacy_id).toBeNull();
    expect(data[0].talent_amount).toBeNull();
  });

  it('derives subtotal from billed total when only price_total is mapped', () => {
    const totalOnly: ColumnMapping[] = mappings.filter(
      (m) => m.dbColumn !== 'price_subtotal'
    );
    const { data } = transformOrders(
      [baseRow({ 'Total Price (w/ Discount)': '' })],
      totalOnly,
      makeLookups(),
      0
    );
    // Billed Price 24.6 / 1.23 ≈ 20.00
    expect(data[0].price_subtotal).toBeCloseTo(20.0, 2);
    expect(data[0].price_tax).toBeCloseTo(4.6, 2);
    expect(data[0].price_total).toBeCloseTo(24.6, 2);
  });
});

describe('transformOrders — errors', () => {
  it('reports an error when client is not found', () => {
    const { data, errors } = transformOrders(
      [baseRow({ 'Client Name': 'Unknown Person' })],
      mappings,
      makeLookups(),
      10
    );
    expect(data).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0].rowIndex).toBe(10);
    expect(errors[0].message).toContain('Unknown Person');
  });

  it('reports an error when contact_name and contact_email are both empty', () => {
    const { data, errors } = transformOrders(
      [baseRow({ 'Client Name': '', 'Client Email': '' })],
      mappings,
      makeLookups(),
      0
    );
    expect(data).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });

  it('reports an error when defaultCountryId is missing', () => {
    const lookups: OrderLookups = { ...makeLookups(), defaultCountryId: null };
    const { data, errors } = transformOrders([baseRow()], mappings, lookups, 0);
    expect(data).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });
});

describe('transformOrders — ES status mapping', () => {
  it('maps "Rechazado" → cancelado', () => {
    const { data } = transformOrders(
      [baseRow({ 'Status': 'Rechazado' })], mappings, makeLookups(), 0
    );
    expect(data[0].status).toBe('cancelado');
  });

  it('maps "Pendiente de Pago" → asignado', () => {
    const { data } = transformOrders(
      [baseRow({ 'Status': 'Pendiente de Pago' })], mappings, makeLookups(), 0
    );
    expect(data[0].status).toBe('asignado');
  });

  it('maps "Pendiente" → nuevo', () => {
    const { data } = transformOrders(
      [baseRow({ 'Status': 'Pendiente' })], mappings, makeLookups(), 0
    );
    expect(data[0].status).toBe('nuevo');
  });

  it('maps "Terminado" → completado', () => {
    const { data } = transformOrders(
      [baseRow({ 'Status': 'Terminado' })], mappings, makeLookups(), 0
    );
    expect(data[0].status).toBe('completado');
  });
});

describe('transformOrders — ES new columns', () => {
  const esMappings: ColumnMapping[] = [
    ...mappings,
    { csvColumn: '55+ Member', dbColumn: 'staff_member_name' },
    { csvColumn: 'Appointment Date', dbColumn: 'appointment_date' },
    { csvColumn: 'State/Province', dbColumn: 'service_state' },
    { csvColumn: 'Unit Price', dbColumn: 'unit_price' },
    { csvColumn: 'Specialist Unit Price', dbColumn: 'specialist_unit_price' },
    { csvColumn: 'Quantity', dbColumn: 'quantity' },
    { csvColumn: 'Discount', dbColumn: 'discount' },
    { csvColumn: 'Client payed', dbColumn: 'payment_status' },
    { csvColumn: 'Rating', dbColumn: 'rating' },
    { csvColumn: 'Stripe Id', dbColumn: 'stripe_id' },
  ];

  function esRow(overrides: Record<string, string> = {}): Record<string, string> {
    return {
      ...baseRow(),
      '55+ Member': 'Elena Parras',
      'Appointment Date': 'Sep 26, 2025 7:00 am',
      'State/Province': 'Comunidad Valenciana',
      'Unit Price': '12.5',
      'Specialist Unit Price': '10',
      'Quantity': '2',
      'Discount': '5',
      'Client payed': 'no',
      'Rating': '4',
      'Stripe Id': 'pi_abc123',
      ...overrides,
    };
  }

  it('resolves staff_member_id via lookup', () => {
    const { data } = transformOrders([esRow()], esMappings, makeLookups(), 0);
    expect(data[0].staff_member_id).toBe('staff-1');
  });

  it('parses appointment_date to ISO string', () => {
    const { data } = transformOrders([esRow()], esMappings, makeLookups(), 0);
    expect(data[0].appointment_date).toContain('2025');
    expect(new Date(data[0].appointment_date!).getFullYear()).toBe(2025);
  });

  it('passes service_state through', () => {
    const { data } = transformOrders([esRow()], esMappings, makeLookups(), 0);
    expect(data[0].service_state).toBe('Comunidad Valenciana');
  });

  it('parses numeric fields: unit_price, specialist_unit_price, quantity, discount', () => {
    const { data } = transformOrders([esRow()], esMappings, makeLookups(), 0);
    expect(data[0].unit_price).toBeCloseTo(12.5);
    expect(data[0].specialist_unit_price).toBeCloseTo(10);
    expect(data[0].quantity).toBeCloseTo(2);
    expect(data[0].discount).toBeCloseTo(5);
  });

  it('resolves payment_status: "no" → unpaid, "si" → paid', () => {
    const { data: d1 } = transformOrders([esRow({ 'Client payed': 'no' })], esMappings, makeLookups(), 0);
    expect(d1[0].payment_status).toBe('unpaid');
    const { data: d2 } = transformOrders([esRow({ 'Client payed': 'si' })], esMappings, makeLookups(), 0);
    expect(d2[0].payment_status).toBe('paid');
  });

  it('parses rating as integer 1-5, null for out of range', () => {
    const { data: d1 } = transformOrders([esRow({ 'Rating': '4' })], esMappings, makeLookups(), 0);
    expect(d1[0].rating).toBe(4);
    const { data: d2 } = transformOrders([esRow({ 'Rating': '7' })], esMappings, makeLookups(), 0);
    expect(d2[0].rating).toBeNull();
    const { data: d3 } = transformOrders([esRow({ 'Rating': '' })], esMappings, makeLookups(), 0);
    expect(d3[0].rating).toBeNull();
  });

  it('passes stripe_id through', () => {
    const { data } = transformOrders([esRow()], esMappings, makeLookups(), 0);
    expect(data[0].stripe_id).toBe('pi_abc123');
  });

  it('returns null for empty optional fields', () => {
    const { data } = transformOrders(
      [esRow({ '55+ Member': '', 'Appointment Date': '', 'Rating': '', 'Stripe Id': '' })],
      esMappings, makeLookups(), 0
    );
    expect(data[0].staff_member_id).toBeNull();
    expect(data[0].appointment_date).toBeNull();
    expect(data[0].rating).toBeNull();
    expect(data[0].stripe_id).toBeNull();
  });
});
