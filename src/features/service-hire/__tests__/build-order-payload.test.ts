import { describe, it, expect } from 'vitest';
import { buildOrderPayload } from '../actions/_helpers/build-order-payload';

const baseArgs = {
  userId: 'user-1',
  serviceId: 'svc-1',
  countryId: 'country-1',
  serviceCityId: 'city-1',
  serviceAddress: 'Calle 1',
  servicePostalCode: '28001',
  scheduleType: 'once' as const,
  appointmentDate: '2026-06-01T10:00:00Z',
  timezone: 'Europe/Madrid',
  contact: {
    name: 'Pepe',
    email: 'pepe@example.com',
    phone: '+34 600 000 000',
    fiscal_id_type_id: 'fit-1',
    fiscal_id: '12345678Z',
  },
  billing: undefined,
  notes: 'something',
  answers: {} as never,
};

describe('buildOrderPayload', () => {
  it('snapshots contact fields into contact_*', () => {
    const row = buildOrderPayload(baseArgs);
    expect(row.contact_name).toBe('Pepe');
    expect(row.contact_email).toBe('pepe@example.com');
    expect(row.contact_phone).toBe('+34 600 000 000');
    expect(row.contact_fiscal_id_type_id).toBe('fit-1');
    expect(row.contact_fiscal_id).toBe('12345678Z');
  });

  it('billing_override is null when billing absent', () => {
    expect(buildOrderPayload(baseArgs).billing_override).toBeNull();
  });

  it('billing_override is null when billing.mode === same', () => {
    const row = buildOrderPayload({ ...baseArgs, billing: { mode: 'same' } });
    expect(row.billing_override).toBeNull();
  });

  it('billing_override carries data when mode === custom', () => {
    const data = {
      name: 'Empresa SL',
      phone: '+34 911 000 000',
      fiscal_id_type_id: 'fit-2',
      fiscal_id: 'B12345678',
    };
    const row = buildOrderPayload({
      ...baseArgs,
      billing: { mode: 'custom', data },
    });
    expect(row.billing_override).toEqual(data);
  });

  it('contact fiscal can be null (guest before save-guest-contact)', () => {
    const row = buildOrderPayload({
      ...baseArgs,
      contact: { ...baseArgs.contact, fiscal_id_type_id: null, fiscal_id: null },
    });
    expect(row.contact_fiscal_id_type_id).toBeNull();
    expect(row.contact_fiscal_id).toBeNull();
  });

  it('preserves fixed defaults (status, price, currency)', () => {
    const row = buildOrderPayload(baseArgs);
    expect(row.payment_status).toBe('pending');
    expect(row.currency).toBe('EUR');
    expect(row.price_subtotal).toBe(0);
  });
});
