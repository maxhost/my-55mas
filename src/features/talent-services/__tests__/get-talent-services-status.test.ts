import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { getTalentServicesStatus } from '../actions/get-talent-services-status';
import { createClient } from '@/lib/supabase/server';

const mockedCreate = vi.mocked(createClient);

type ProfileRow = {
  id: string;
  country_id: string | null;
  city_id: string | null;
} | null;

function makeSupabase(opts: {
  user?: { id: string } | null;
  profile?: ProfileRow;
  talentServicesRows?: { service_id: string; form_data: unknown }[];
  publishedServices?: {
    id: string;
    slug: string;
    translations?: { locale: string; name: string }[];
  }[];
  inCountry?: string[];
  inCity?: string[];
}) {
  const auth = {
    getUser: vi.fn().mockResolvedValue({
      data: { user: opts.user ?? null },
      error: null,
    }),
  };

  const fromMock = vi.fn().mockImplementation((table: string) => {
    if (table === 'talent_profiles') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({ data: opts.profile ?? null, error: null }),
          }),
        }),
      };
    }
    if (table === 'talent_services') {
      return {
        select: () => ({
          eq: () => ({
            eq: () =>
              Promise.resolve({
                data: opts.talentServicesRows ?? [],
                error: null,
              }),
          }),
        }),
      };
    }
    if (table === 'services') {
      return {
        select: () => ({
          in: () => ({
            eq: () =>
              Promise.resolve({
                data: (opts.publishedServices ?? []).map((s) => ({
                  id: s.id,
                  slug: s.slug,
                  service_translations: s.translations ?? [],
                })),
                error: null,
              }),
          }),
        }),
      };
    }
    if (table === 'service_countries') {
      return {
        select: () => ({
          eq: () => ({
            in: () =>
              Promise.resolve({
                data: (opts.inCountry ?? []).map((id) => ({ service_id: id })),
                error: null,
              }),
          }),
        }),
      };
    }
    if (table === 'service_cities') {
      return {
        select: () => ({
          eq: () => ({
            in: () =>
              Promise.resolve({
                data: (opts.inCity ?? []).map((id) => ({ service_id: id })),
                error: null,
              }),
          }),
        }),
      };
    }
    throw new Error(`unexpected table: ${table}`);
  });

  return { auth, from: fromMock } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getTalentServicesStatus — denied paths', () => {
  it('returns not-authenticated when no user', async () => {
    mockedCreate.mockReturnValue(makeSupabase({ user: null }));
    const result = await getTalentServicesStatus('es');
    expect(result).toEqual({ ok: false, reason: 'not-authenticated' });
  });

  it('returns no-talent-profile when no row', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({ user: { id: 'u1' }, profile: null })
    );
    const result = await getTalentServicesStatus('es');
    expect(result).toEqual({ ok: false, reason: 'no-talent-profile' });
  });

  it('returns talent-country-not-set when profile.country_id null', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { id: 't1', country_id: null, city_id: null },
      })
    );
    const result = await getTalentServicesStatus('es');
    expect(result).toEqual({ ok: false, reason: 'talent-country-not-set' });
  });
});

describe('getTalentServicesStatus — empty + happy', () => {
  it('returns empty list when talent has no rows', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { id: 't1', country_id: 'ar', city_id: 'baires' },
        talentServicesRows: [],
      })
    );
    const result = await getTalentServicesStatus('es');
    expect(result).toEqual({
      ok: true,
      services: [],
      saved: 0,
      total: 0,
      countryId: 'ar',
      cityId: 'baires',
    });
  });

  it('returns filtered services with status badges', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { id: 't1', country_id: 'ar', city_id: 'baires' },
        talentServicesRows: [
          { service_id: 'A', form_data: { price: 100 } }, // saved
          { service_id: 'B', form_data: null }, // pendiente
          { service_id: 'C', form_data: null }, // pendiente
        ],
        publishedServices: [
          {
            id: 'A',
            slug: 'plomeria',
            translations: [{ locale: 'es', name: 'Plomería' }],
          },
          {
            id: 'B',
            slug: 'carpinteria',
            translations: [{ locale: 'es', name: 'Carpintería' }],
          },
          {
            id: 'C',
            slug: 'pintura',
            translations: [{ locale: 'es', name: 'Pintura' }],
          },
        ],
        inCountry: ['A', 'B', 'C'],
        inCity: ['A', 'B', 'C'],
      })
    );
    const result = await getTalentServicesStatus('es');
    if (!result.ok) throw new Error('expected ok');
    expect(result.total).toBe(3);
    expect(result.saved).toBe(1);
    expect(result.services.find((s) => s.serviceId === 'A')?.hasFormData).toBe(
      true
    );
    expect(result.services.find((s) => s.serviceId === 'B')?.hasFormData).toBe(
      false
    );
  });
});

describe('getTalentServicesStatus — silent skip de servicios fuera de filtro', () => {
  it('omits services that lost published status', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { id: 't1', country_id: 'ar', city_id: 'baires' },
        talentServicesRows: [
          { service_id: 'A', form_data: {} },
          { service_id: 'C', form_data: {} }, // published query no lo retorna
        ],
        publishedServices: [
          { id: 'A', slug: 'a', translations: [{ locale: 'es', name: 'A' }] },
        ],
        inCountry: ['A', 'C'],
        inCity: ['A', 'C'],
      })
    );
    const result = await getTalentServicesStatus('es');
    if (!result.ok) throw new Error('expected ok');
    expect(result.services.map((s) => s.serviceId)).toEqual(['A']);
    expect(result.total).toBe(1);
  });

  it('omits services no longer in talent country', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { id: 't1', country_id: 'ar', city_id: 'baires' },
        talentServicesRows: [
          { service_id: 'A', form_data: {} },
          { service_id: 'B', form_data: {} },
        ],
        publishedServices: [
          { id: 'A', slug: 'a', translations: [] },
          { id: 'B', slug: 'b', translations: [] },
        ],
        inCountry: ['A'], // B NO está en country
        inCity: ['A', 'B'],
      })
    );
    const result = await getTalentServicesStatus('es');
    if (!result.ok) throw new Error('expected ok');
    expect(result.services.map((s) => s.serviceId)).toEqual(['A']);
  });

  it('with cityId null, ignores city filter', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { id: 't1', country_id: 'ar', city_id: null },
        talentServicesRows: [{ service_id: 'A', form_data: {} }],
        publishedServices: [
          { id: 'A', slug: 'a', translations: [] },
        ],
        inCountry: ['A'],
        // inCity not relevant (cityId null) — getTalentServicesStatus
        // skips city filter entirely.
      })
    );
    const result = await getTalentServicesStatus('es');
    if (!result.ok) throw new Error('expected ok');
    expect(result.services).toHaveLength(1);
  });
});
