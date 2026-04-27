import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));
vi.mock('@/shared/lib/field-catalog/persistence/service-select', () => ({
  writeServiceSelect: vi.fn(),
}));

import { commitTalentServiceSelection } from '../actions/commit-talent-service-selection';
import { createClient } from '@/lib/supabase/server';
import { writeServiceSelect } from '@/shared/lib/field-catalog/persistence/service-select';

const mockedCreate = vi.mocked(createClient);
const mockedWrite = vi.mocked(writeServiceSelect);

type ProfileRow = {
  id: string;
  country_id: string | null;
  city_id: string | null;
} | null;

function makeSupabase(opts: {
  user?: { id: string } | null;
  profile?: ProfileRow;
  publishedIds?: string[];
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
    if (table === 'services') {
      return {
        select: () => ({
          in: () => ({
            eq: () =>
              Promise.resolve({
                data: (opts.publishedIds ?? []).map((id) => ({ id })),
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
  mockedWrite.mockResolvedValue(undefined);
});

describe('commitTalentServiceSelection — denied paths', () => {
  it('returns notAuthenticated when no user', async () => {
    mockedCreate.mockReturnValue(makeSupabase({ user: null }));
    const result = await commitTalentServiceSelection({ serviceIds: ['A'] });
    expect(result).toEqual({ error: { _auth: ['notAuthenticated'] } });
    expect(mockedWrite).not.toHaveBeenCalled();
  });

  it('returns noTalentProfile when no row', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({ user: { id: 'u1' }, profile: null })
    );
    const result = await commitTalentServiceSelection({ serviceIds: ['A'] });
    expect(result).toEqual({ error: { _auth: ['noTalentProfile'] } });
    expect(mockedWrite).not.toHaveBeenCalled();
  });

  it('returns talentCountryNotSet when country_id null', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { id: 't1', country_id: null, city_id: null },
      })
    );
    const result = await commitTalentServiceSelection({ serviceIds: ['A'] });
    expect(result).toEqual({ error: { _config: ['talentCountryNotSet'] } });
    expect(mockedWrite).not.toHaveBeenCalled();
  });
});

describe('commitTalentServiceSelection — defense-in-depth', () => {
  it('rejects when serviceId is not published', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { id: 't1', country_id: 'ar', city_id: 'baires' },
        publishedIds: ['A'], // B no published
        inCountry: ['A', 'B'],
        inCity: ['A', 'B'],
      })
    );
    const result = await commitTalentServiceSelection({
      serviceIds: ['A', 'B'],
    });
    expect(result).toEqual({ error: { _config: ['serviceNotAvailable'] } });
    expect(mockedWrite).not.toHaveBeenCalled();
  });

  it('rejects when serviceId is not in country', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { id: 't1', country_id: 'ar', city_id: 'baires' },
        publishedIds: ['A', 'B'],
        inCountry: ['A'], // B no en AR
        inCity: ['A', 'B'],
      })
    );
    const result = await commitTalentServiceSelection({
      serviceIds: ['A', 'B'],
    });
    expect(result).toEqual({ error: { _config: ['serviceNotAvailable'] } });
  });

  it('rejects when serviceId is not in city', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { id: 't1', country_id: 'ar', city_id: 'baires' },
        publishedIds: ['A', 'B'],
        inCountry: ['A', 'B'],
        inCity: ['A'], // B no en baires
      })
    );
    const result = await commitTalentServiceSelection({
      serviceIds: ['A', 'B'],
    });
    expect(result).toEqual({ error: { _config: ['serviceNotAvailable'] } });
  });
});

describe('commitTalentServiceSelection — happy', () => {
  it('persists via writeServiceSelect with country_id from profile', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { id: 't1', country_id: 'ar', city_id: 'baires' },
        publishedIds: ['A', 'B'],
        inCountry: ['A', 'B'],
        inCity: ['A', 'B'],
      })
    );
    const result = await commitTalentServiceSelection({
      serviceIds: ['A', 'B'],
    });
    expect(result).toEqual({ data: { count: 2 } });
    expect(mockedWrite).toHaveBeenCalledWith(
      expect.anything(),
      'u1',
      ['A', 'B'],
      { country_id: 'ar' }
    );
  });

  it('handles empty selection (clears all)', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { id: 't1', country_id: 'ar', city_id: 'baires' },
      })
    );
    const result = await commitTalentServiceSelection({ serviceIds: [] });
    expect(result).toEqual({ data: { count: 0 } });
    expect(mockedWrite).toHaveBeenCalledWith(
      expect.anything(),
      'u1',
      [],
      { country_id: 'ar' }
    );
  });

  it('without cityId, validates only country (no city filter)', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { id: 't1', country_id: 'ar', city_id: null },
        publishedIds: ['A'],
        inCountry: ['A'],
      })
    );
    const result = await commitTalentServiceSelection({ serviceIds: ['A'] });
    expect(result).toEqual({ data: { count: 1 } });
  });

  it('surfaces writeServiceSelect errors as _db', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { id: 't1', country_id: 'ar', city_id: null },
        publishedIds: ['A'],
        inCountry: ['A'],
      })
    );
    mockedWrite.mockRejectedValue(new Error('fk violation'));
    const result = await commitTalentServiceSelection({ serviceIds: ['A'] });
    expect(result).toEqual({ error: { _db: ['fk violation'] } });
  });
});
