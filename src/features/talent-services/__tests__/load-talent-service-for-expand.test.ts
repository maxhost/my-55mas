import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));
vi.mock('../actions/get-resolved-embeddable-talent-form', () => ({
  getResolvedEmbeddableTalentForm: vi.fn(),
}));

import { loadTalentServiceForExpand } from '../actions/load-talent-service-for-expand';
import { getResolvedEmbeddableTalentForm } from '../actions/get-resolved-embeddable-talent-form';
import { createClient } from '@/lib/supabase/server';

const mockedCreate = vi.mocked(createClient);
const mockedResolve = vi.mocked(getResolvedEmbeddableTalentForm);

function makeSupabase(opts: {
  user?: { id: string } | null;
  profile?: { country_id: string | null; city_id: string | null } | null;
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
    throw new Error(`unexpected table: ${table}`);
  });
  return { auth, from: fromMock } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('loadTalentServiceForExpand — denied paths', () => {
  it('returns not-authenticated when user is null', async () => {
    mockedCreate.mockReturnValue(makeSupabase({ user: null }));
    const result = await loadTalentServiceForExpand({ slug: 'a' }, 'es');
    expect(result).toEqual({ ok: false, reason: 'not-authenticated' });
  });

  it('returns no-talent-profile when no row', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({ user: { id: 'u1' }, profile: null })
    );
    const result = await loadTalentServiceForExpand({ slug: 'a' }, 'es');
    expect(result).toEqual({ ok: false, reason: 'no-talent-profile' });
  });
});

describe('loadTalentServiceForExpand — passes embed reasons', () => {
  it('passes through unknown-slug', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { country_id: 'ar', city_id: 'baires' },
      })
    );
    mockedResolve.mockResolvedValue({
      available: false,
      reason: 'unknown-slug',
    });
    const result = await loadTalentServiceForExpand({ slug: 'x' }, 'es');
    expect(result).toEqual({ ok: false, reason: 'unknown-slug' });
  });

  it('passes through service-not-active', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { country_id: 'ar', city_id: 'baires' },
      })
    );
    mockedResolve.mockResolvedValue({
      available: false,
      reason: 'service-not-active',
    });
    const result = await loadTalentServiceForExpand({ slug: 'x' }, 'es');
    expect(result).toEqual({ ok: false, reason: 'service-not-active' });
  });
});

describe('loadTalentServiceForExpand — happy', () => {
  it('returns resolvedForm + meta when available', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { country_id: 'ar', city_id: 'baires' },
      })
    );
    mockedResolve.mockResolvedValue({
      available: true,
      resolvedForm: { steps: [] },
      meta: { formId: 'form-1', serviceId: 'svc-1' },
    });
    const result = await loadTalentServiceForExpand({ slug: 'plomeria' }, 'es');
    if (!result.ok) throw new Error('expected ok');
    expect(result.formId).toBe('form-1');
    expect(result.serviceId).toBe('svc-1');
  });

  it('passes serviceFilter to getResolvedEmbeddableTalentForm', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { country_id: 'ar', city_id: 'baires' },
      })
    );
    mockedResolve.mockResolvedValue({
      available: true,
      resolvedForm: { steps: [] },
      meta: { formId: 'f', serviceId: 's' },
    });
    await loadTalentServiceForExpand({ slug: 'a' }, 'es');
    expect(mockedResolve).toHaveBeenCalledWith(
      'a',
      'baires',
      'es',
      'u1',
      { countryId: 'ar', cityId: 'baires' }
    );
  });
});
