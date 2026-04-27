import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveTalentAccess } from '../actions/resolve-talent-access';

function makeSupabase(profileRow: {
  id: string;
  country_id: string | null;
  city_id: string | null;
} | null) {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table !== 'talent_profiles') {
        throw new Error(`unexpected table: ${table}`);
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({ data: profileRow, error: null }),
          }),
        }),
      };
    }),
  } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resolveTalentAccess — denied', () => {
  it('returns not-authenticated when userId is null', async () => {
    const sb = makeSupabase(null);
    const result = await resolveTalentAccess(sb, null, 'ar');
    expect(result).toEqual({ granted: false, reason: 'not-authenticated' });
  });

  it('returns no-talent-profile when no row for user', async () => {
    const sb = makeSupabase(null);
    const result = await resolveTalentAccess(sb, 'user-1', 'ar');
    expect(result).toEqual({ granted: false, reason: 'no-talent-profile' });
  });

  it('returns talent-country-not-set when profile has country_id null', async () => {
    const sb = makeSupabase({
      id: 'talent-1',
      country_id: null,
      city_id: null,
    });
    const result = await resolveTalentAccess(sb, 'user-1', 'ar');
    expect(result).toEqual({
      granted: false,
      reason: 'talent-country-not-set',
    });
  });

  it('returns country-mismatch when talent country !== site country', async () => {
    const sb = makeSupabase({
      id: 'talent-1',
      country_id: 'uy',
      city_id: 'mvd',
    });
    const result = await resolveTalentAccess(sb, 'user-1', 'ar');
    expect(result).toEqual({ granted: false, reason: 'country-mismatch' });
  });
});

describe('resolveTalentAccess — granted', () => {
  it('returns granted with talentId, countryId, cityId on match', async () => {
    const sb = makeSupabase({
      id: 'talent-7',
      country_id: 'ar',
      city_id: 'baires',
    });
    const result = await resolveTalentAccess(sb, 'user-1', 'ar');
    expect(result).toEqual({
      granted: true,
      talentId: 'talent-7',
      countryId: 'ar',
      cityId: 'baires',
    });
  });

  it('returns granted with cityId null when talent has no city', async () => {
    const sb = makeSupabase({
      id: 'talent-8',
      country_id: 'ar',
      city_id: null,
    });
    const result = await resolveTalentAccess(sb, 'user-1', 'ar');
    expect(result).toEqual({
      granted: true,
      talentId: 'talent-8',
      countryId: 'ar',
      cityId: null,
    });
  });
});
