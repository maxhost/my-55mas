import { describe, it, expect } from 'vitest';
import { composeAppointmentUtc } from '../compose-appointment';
import {
  formatTimeInTz,
  formatDateInTz,
  addMinutesToIso,
} from '../format-in-timezone';

describe('formatTimeInTz', () => {
  it('formats Madrid CEST UTC instant back to local 24h time', () => {
    expect(formatTimeInTz('2026-05-10T08:00:00.000Z', 'Europe/Madrid')).toBe(
      '10:00',
    );
  });

  it('formats Madrid CET UTC instant back to local 24h time', () => {
    expect(formatTimeInTz('2026-02-10T09:00:00.000Z', 'Europe/Madrid')).toBe(
      '10:00',
    );
  });

  it('formats Lisbon WEST UTC instant back to local 24h time', () => {
    expect(formatTimeInTz('2026-05-10T09:00:00.000Z', 'Europe/Lisbon')).toBe(
      '10:00',
    );
  });

  it('uses 24h format (00:00 not 24:00) for midnight', () => {
    expect(formatTimeInTz('2026-05-09T22:00:00.000Z', 'Europe/Madrid')).toBe(
      '00:00',
    );
  });

  it('throws on invalid timezone', () => {
    expect(() =>
      formatTimeInTz('2026-05-10T08:00:00Z', 'Foo/Bar'),
    ).toThrow(/timezone/i);
  });
});

describe('formatDateInTz', () => {
  it('formats date in target timezone (date may differ from UTC date)', () => {
    // 22:30 UTC on 10 may = 00:30 local on 11 may in Madrid (CEST)
    const formatted = formatDateInTz(
      '2026-05-10T22:30:00.000Z',
      'Europe/Madrid',
      'es',
    );
    expect(formatted).toMatch(/11/);
    expect(formatted).toMatch(/2026/);
  });

  it('uses provided locale', () => {
    const es = formatDateInTz('2026-05-10T08:00:00Z', 'Europe/Madrid', 'es');
    const en = formatDateInTz('2026-05-10T08:00:00Z', 'Europe/Madrid', 'en');
    expect(es).not.toBe(en);
  });

  it('throws on invalid timezone', () => {
    expect(() =>
      formatDateInTz('2026-05-10T08:00:00Z', 'Foo/Bar', 'es'),
    ).toThrow(/timezone/i);
  });
});

describe('addMinutesToIso', () => {
  it('adds minutes preserving UTC ISO format', () => {
    expect(addMinutesToIso('2026-05-10T08:00:00.000Z', 60)).toBe(
      '2026-05-10T09:00:00.000Z',
    );
  });

  it('handles negative offsets', () => {
    expect(addMinutesToIso('2026-05-10T08:00:00.000Z', -30)).toBe(
      '2026-05-10T07:30:00.000Z',
    );
  });

  it('crosses day boundary', () => {
    expect(addMinutesToIso('2026-05-10T23:30:00.000Z', 60)).toBe(
      '2026-05-11T00:30:00.000Z',
    );
  });
});

describe('round-trip property', () => {
  it.each([
    ['Europe/Madrid', '2026-05-10', '10:00'], // CEST
    ['Europe/Madrid', '2026-02-10', '10:00'], // CET
    ['Europe/Madrid', '2026-03-29', '10:00'], // DST start day, post-jump
    ['Europe/Madrid', '2026-10-25', '10:00'], // DST end day
    ['Europe/Lisbon', '2026-05-10', '10:00'], // WEST
    ['Europe/Lisbon', '2026-02-10', '10:00'], // WET
    ['Europe/Madrid', '2026-05-10', '00:00'],
    ['Europe/Madrid', '2026-05-10', '23:59'],
  ])(
    'compose+format returns the same wall-clock for tz=%s date=%s time=%s',
    (tz, date, time) => {
      const utc = composeAppointmentUtc(date, time, tz);
      expect(formatTimeInTz(utc, tz)).toBe(time);
    },
  );
});
