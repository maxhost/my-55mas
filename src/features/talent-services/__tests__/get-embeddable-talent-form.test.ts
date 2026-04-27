import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));
vi.mock('../actions/get-talent-form', () => ({
  getTalentForm: vi.fn(),
}));

import { getEmbeddableTalentForm } from '../actions/get-embeddable-talent-form';
import { getTalentForm } from '../actions/get-talent-form';
import { createClient } from '@/lib/supabase/server';

const mockedCreateClient = vi.mocked(createClient);
const mockedGetTalentForm = vi.mocked(getTalentForm);

function makeSupabase(opts: {
  serviceRow?: { id: string; status: string } | null;
  duplicates?: { id: string }[];
}) {
  const fromMock = vi.fn();

  fromMock.mockImplementation((table: string) => {
    if (table === 'services') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({ data: opts.serviceRow ?? null, error: null }),
          }),
        }),
      };
    }
    if (table === 'talent_forms') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              filter: () =>
                Promise.resolve({ data: opts.duplicates ?? null, error: null }),
            }),
          }),
        }),
      };
    }
    return {};
  });

  return { from: fromMock } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getEmbeddableTalentForm — service lookup', () => {
  it('returns unknown-slug when services row is null', async () => {
    mockedCreateClient.mockReturnValue(makeSupabase({ serviceRow: null }));
    const result = await getEmbeddableTalentForm('does-not-exist', null);
    expect(result).toEqual({ available: false, reason: 'unknown-slug' });
  });

  it('returns service-not-active when status !== active', async () => {
    mockedCreateClient.mockReturnValue(
      makeSupabase({ serviceRow: { id: 'svc-1', status: 'draft' } })
    );
    const result = await getEmbeddableTalentForm('plomeria', null);
    expect(result).toEqual({ available: false, reason: 'service-not-active' });
  });
});

describe('getEmbeddableTalentForm — form lookup', () => {
  it('returns no-active-form when getTalentForm returns null', async () => {
    mockedCreateClient.mockReturnValue(
      makeSupabase({ serviceRow: { id: 'svc-1', status: 'active' } })
    );
    mockedGetTalentForm.mockResolvedValue(null);
    const result = await getEmbeddableTalentForm('plomeria', 'city-1');
    expect(result).toEqual({ available: false, reason: 'no-active-form' });
  });

  it('returns available with form + service_id when found', async () => {
    mockedCreateClient.mockReturnValue(
      makeSupabase({
        serviceRow: { id: 'svc-1', status: 'active' },
        duplicates: [{ id: 'f1' }],
      })
    );
    mockedGetTalentForm.mockResolvedValue({
      id: 'f1',
      service_id: 'svc-1',
      city_id: 'city-1',
      schema: { steps: [] },
      version: 1,
      is_active: true,
      translations: {},
    } as never);
    const result = await getEmbeddableTalentForm('plomeria', 'city-1');
    if (!result.available) throw new Error('expected available');
    expect(result.service_id).toBe('svc-1');
    expect(result.form.id).toBe('f1');
  });
});

describe('getEmbeddableTalentForm — multiple active rows warning', () => {
  it('does not fail when there are multiple active rows; just dev-warns', async () => {
    mockedCreateClient.mockReturnValue(
      makeSupabase({
        serviceRow: { id: 'svc-1', status: 'active' },
        duplicates: [{ id: 'f1' }, { id: 'f2' }],
      })
    );
    mockedGetTalentForm.mockResolvedValue({
      id: 'f1',
      service_id: 'svc-1',
      city_id: 'city-1',
      schema: { steps: [] },
      version: 1,
      is_active: true,
      translations: {},
    } as never);
    // Returns happy-path despite duplicates (first row wins per ORDER BY version).
    const result = await getEmbeddableTalentForm('plomeria', 'city-1');
    expect(result.available).toBe(true);
  });
});

describe('getEmbeddableTalentForm — fallback to general (city=null)', () => {
  it('returns the general variant when city variant missing', async () => {
    mockedCreateClient.mockReturnValue(
      makeSupabase({ serviceRow: { id: 'svc-1', status: 'active' } })
    );
    // getTalentForm con fallback=true ya retorna la general en este caso.
    mockedGetTalentForm.mockResolvedValue({
      id: 'general-form',
      service_id: 'svc-1',
      city_id: null,
      schema: { steps: [] },
      version: 1,
      is_active: true,
      translations: {},
    } as never);
    const result = await getEmbeddableTalentForm('plomeria', 'city-1');
    if (!result.available) throw new Error('expected available');
    expect(result.form.city_id).toBeNull();
  });
});
