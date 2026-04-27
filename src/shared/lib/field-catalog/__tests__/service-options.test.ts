import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadAvailableServicesForTalent } from '../service-options';

// Helper para construir un mock supabase.from() con los 3 datasets que
// loadAvailableServicesForTalent consulta secuencialmente:
// services (filtered by status='published'), service_countries, service_cities.
function makeSupabase(opts: {
  services: { id: string; translations?: { locale: string; name: string }[] }[];
  serviceCountriesByCountry: Record<string, string[]>;
  serviceCitiesByCity?: Record<string, string[]>;
}) {
  const fromMock = vi.fn().mockImplementation((table: string) => {
    if (table === 'services') {
      return {
        select: () => ({
          eq: () =>
            Promise.resolve({
              data: opts.services.map((s) => ({
                id: s.id,
                service_translations: s.translations ?? [],
              })),
              error: null,
            }),
        }),
      };
    }
    if (table === 'service_countries') {
      return {
        select: () => ({
          eq: (_col: string, countryId: string) =>
            Promise.resolve({
              data: (opts.serviceCountriesByCountry[countryId] ?? []).map(
                (id) => ({ service_id: id })
              ),
              error: null,
            }),
        }),
      };
    }
    if (table === 'service_cities') {
      return {
        select: () => ({
          eq: (_col: string, cityId: string) =>
            Promise.resolve({
              data: ((opts.serviceCitiesByCity ?? {})[cityId] ?? []).map(
                (id) => ({ service_id: id })
              ),
              error: null,
            }),
        }),
      };
    }
    throw new Error(`unexpected table: ${table}`);
  });
  return { from: fromMock } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('loadAvailableServicesForTalent', () => {
  it('returns intersection of published × country × city', async () => {
    const sb = makeSupabase({
      services: [
        { id: 'A', translations: [{ locale: 'es', name: 'Plomería' }] },
        { id: 'B', translations: [{ locale: 'es', name: 'Carpintería' }] },
        { id: 'C', translations: [{ locale: 'es', name: 'Pintura' }] },
      ],
      serviceCountriesByCountry: {
        ar: ['A', 'B', 'C'], // todos en AR
      },
      serviceCitiesByCity: {
        'baires': ['A', 'B'], // C no está en Buenos Aires
      },
    });
    const result = await loadAvailableServicesForTalent(sb, 'es', 'ar', 'baires');
    expect(result.map((s) => s.id).sort()).toEqual(['A', 'B']);
  });

  it('returns empty when service is in country but not city', async () => {
    const sb = makeSupabase({
      services: [{ id: 'A', translations: [] }],
      serviceCountriesByCountry: { ar: ['A'] },
      serviceCitiesByCity: { mvd: [] }, // mvd no tiene A
    });
    const result = await loadAvailableServicesForTalent(sb, 'es', 'ar', 'mvd');
    expect(result).toEqual([]);
  });

  it('returns empty when service is published but not in country', async () => {
    const sb = makeSupabase({
      services: [{ id: 'A', translations: [] }],
      serviceCountriesByCountry: {}, // no hay row para ar
    });
    const result = await loadAvailableServicesForTalent(sb, 'es', 'ar', null);
    expect(result).toEqual([]);
  });

  it('without cityId, filters only by country (city ignored)', async () => {
    const sb = makeSupabase({
      services: [
        { id: 'A', translations: [{ locale: 'es', name: 'A' }] },
        { id: 'B', translations: [{ locale: 'es', name: 'B' }] },
      ],
      serviceCountriesByCountry: { ar: ['A'] }, // B no en AR
    });
    const result = await loadAvailableServicesForTalent(sb, 'es', 'ar', null);
    expect(result.map((s) => s.id)).toEqual(['A']);
  });

  it('uses locale translation, falls back to es, finally to id', async () => {
    const sb = makeSupabase({
      services: [
        {
          id: 'svc-1',
          translations: [
            { locale: 'es', name: 'Plomería' },
            { locale: 'en', name: 'Plumbing' },
          ],
        },
      ],
      serviceCountriesByCountry: { ar: ['svc-1'] },
      serviceCitiesByCity: { baires: ['svc-1'] },
    });
    const en = await loadAvailableServicesForTalent(sb, 'en', 'ar', 'baires');
    expect(en[0].name).toBe('Plumbing');
    const fr = await loadAvailableServicesForTalent(sb, 'fr', 'ar', 'baires');
    // No hay 'fr', cae en 'es'.
    expect(fr[0].name).toBe('Plomería');
  });

  it('filters by status=published implicitly (mock only publishes returns)', async () => {
    // El query sólo retorna published, así que cualquier no-published ni
    // siquiera entra en el dataset. Esto es contractual del helper.
    const sb = makeSupabase({
      services: [{ id: 'pub', translations: [] }], // solo published
      serviceCountriesByCountry: { ar: ['pub', 'draft-not-here'] },
    });
    const result = await loadAvailableServicesForTalent(sb, 'es', 'ar', null);
    expect(result.map((s) => s.id)).toEqual(['pub']);
  });
});
