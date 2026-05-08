import { describe, it, expect } from 'vitest';
import { composeAppointmentUtc } from '../compose-appointment';

describe('composeAppointmentUtc', () => {
  it('converts Madrid CEST (May, UTC+2) wall-clock to UTC', () => {
    expect(composeAppointmentUtc('2026-05-10', '10:00', 'Europe/Madrid')).toBe(
      '2026-05-10T08:00:00.000Z',
    );
  });

  it('converts Madrid CET (February, UTC+1) wall-clock to UTC', () => {
    expect(composeAppointmentUtc('2026-02-10', '10:00', 'Europe/Madrid')).toBe(
      '2026-02-10T09:00:00.000Z',
    );
  });

  it('converts Lisbon WEST (May, UTC+1) wall-clock to UTC', () => {
    expect(composeAppointmentUtc('2026-05-10', '10:00', 'Europe/Lisbon')).toBe(
      '2026-05-10T09:00:00.000Z',
    );
  });

  it('converts Lisbon WET (February, UTC+0) wall-clock to UTC', () => {
    expect(composeAppointmentUtc('2026-02-10', '10:00', 'Europe/Lisbon')).toBe(
      '2026-02-10T10:00:00.000Z',
    );
  });

  it('handles DST start boundary in Spain (29 mar 2026, post-jump time)', () => {
    // Spain DST start: 29 mar 2026 at 02:00 local clocks jump to 03:00.
    // 10:00 local on that date is firmly in CEST (UTC+2).
    expect(composeAppointmentUtc('2026-03-29', '10:00', 'Europe/Madrid')).toBe(
      '2026-03-29T08:00:00.000Z',
    );
  });

  it('handles DST end boundary in Spain (25 oct 2026)', () => {
    // Spain DST end: 25 oct 2026 at 03:00 local clocks fall back to 02:00.
    // 10:00 local on that date is in CET (UTC+1).
    expect(composeAppointmentUtc('2026-10-25', '10:00', 'Europe/Madrid')).toBe(
      '2026-10-25T09:00:00.000Z',
    );
  });

  it('handles midnight wall-clock', () => {
    expect(composeAppointmentUtc('2026-05-10', '00:00', 'Europe/Madrid')).toBe(
      '2026-05-09T22:00:00.000Z',
    );
  });

  it('handles 23:59 wall-clock', () => {
    expect(composeAppointmentUtc('2026-05-10', '23:59', 'Europe/Madrid')).toBe(
      '2026-05-10T21:59:00.000Z',
    );
  });

  it('throws on invalid timezone', () => {
    expect(() =>
      composeAppointmentUtc('2026-05-10', '10:00', 'Foo/Bar'),
    ).toThrow(/timezone/i);
  });

  it('throws on malformed date', () => {
    expect(() =>
      composeAppointmentUtc('not-a-date', '10:00', 'Europe/Madrid'),
    ).toThrow();
  });

  it('throws on malformed time', () => {
    expect(() =>
      composeAppointmentUtc('2026-05-10', 'invalid', 'Europe/Madrid'),
    ).toThrow();
  });
});
