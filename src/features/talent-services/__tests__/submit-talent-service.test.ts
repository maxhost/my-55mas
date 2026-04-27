import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock revalidatePath para no romper en jsdom.
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

// Mock supabase server client.
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock persistFormData — verificamos qué fields recibe.
vi.mock('@/shared/lib/field-catalog/persist-form-data', () => ({
  persistFormData: vi.fn(),
}));

import { submitTalentService } from '../actions/submit-talent-service';
import { createClient } from '@/lib/supabase/server';
import { persistFormData } from '@/shared/lib/field-catalog/persist-form-data';
import type { ResolvedForm } from '@/shared/lib/field-catalog/resolved-types';

const mockedCreate = vi.mocked(createClient);
const mockedPersist = vi.mocked(persistFormData);

type ProfileRow = { id: string; country_id: string | null } | null;

function makeSupabase(opts: {
  user?: { id: string } | null;
  profile?: ProfileRow;
  upsertError?: { message: string };
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
        upsert: () =>
          Promise.resolve({ data: null, error: opts.upsertError ?? null }),
      };
    }
    return {};
  });

  return { auth, from: fromMock } as never;
}

function makeForm(fields: Partial<ResolvedForm['steps'][number]['fields'][number]>[]): ResolvedForm {
  return {
    steps: [
      {
        key: 's1',
        label: 'S',
        fields: fields.map((f) => ({
          field_definition_id: 'fd',
          key: 'k',
          input_type: 'text',
          persistence_type: 'form_response',
          persistence_target: null,
          required: false,
          label: 'L',
          placeholder: '',
          options: null,
          options_source: null,
          ...f,
        })) as never,
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedPersist.mockResolvedValue({ ok: true, userId: 'talent-1' });
});

describe('submitTalentService — identity resolution (server-side)', () => {
  it('returns notAuthenticated when auth.getUser returns null', async () => {
    mockedCreate.mockReturnValue(makeSupabase({ user: null }));
    const result = await submitTalentService({
      service_id: 'svc-1',
      form_id: 'f1',
      form_data: {},
      resolved_form: makeForm([]),
    });
    expect(result).toEqual({
      error: { _auth: ['notAuthenticated'] },
    });
    expect(mockedPersist).not.toHaveBeenCalled();
  });

  it('returns noTalentProfile when no talent_profiles row for user', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({ user: { id: 'u1' }, profile: null })
    );
    const result = await submitTalentService({
      service_id: 'svc-1',
      form_id: 'f1',
      form_data: {},
      resolved_form: makeForm([]),
    });
    expect(result).toEqual({
      error: { _auth: ['noTalentProfile'] },
    });
    expect(mockedPersist).not.toHaveBeenCalled();
  });

  it('does NOT accept talent_id from input (security)', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { id: 'real-talent', country_id: 'ar' },
      })
    );
    await submitTalentService({
      service_id: 'svc-1',
      form_id: 'f1',
      form_data: {},
      resolved_form: makeForm([]),
      // @ts-expect-error talent_id no debería ser parte del tipo
      talent_id: 'attacker-talent',
    });
    // El persistFormData debe recibir el talent real, no el del input.
    expect(mockedPersist).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'real-talent' })
    );
  });
});

describe('submitTalentService — countryId validation', () => {
  it('returns countryIdRequired when profile.country_id is null (always)', async () => {
    // talent_services.country_id es NOT NULL — siempre rechazamos null,
    // sin importar si el schema tiene service_select o no.
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { id: 't1', country_id: null },
      })
    );
    const result = await submitTalentService({
      service_id: 'svc-1',
      form_id: 'f1',
      form_data: {},
      resolved_form: makeForm([]),
    });
    expect(result).toEqual({
      error: { _config: ['countryIdRequired'] },
    });
  });

  it('proceeds when country_id is set even without service_select field', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { id: 't1', country_id: 'ar' },
      })
    );
    const result = await submitTalentService({
      service_id: 'svc-1',
      form_id: 'f1',
      form_data: {},
      resolved_form: makeForm([]),
    });
    expect(result).not.toHaveProperty('error');
  });
});

describe('submitTalentService — auth fields are NOT filtered', () => {
  // TDD: este test FALLA con el código viejo (filtra auth fields).
  // Pasa después del fix.
  it('passes auth fields to persistFormData (no-op or updateUser flow)', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { id: 't1', country_id: 'ar' },
      })
    );
    await submitTalentService({
      service_id: 'svc-1',
      form_id: 'f1',
      form_data: { email: 'new@example.com' },
      resolved_form: makeForm([
        {
          key: 'email',
          input_type: 'email' as never,
          persistence_type: 'auth' as never,
          persistence_target: { auth_field: 'email' } as never,
        },
      ]),
    });
    // persistFormData debe recibir el email field (no filtrado).
    const call = mockedPersist.mock.calls[0]?.[0];
    expect(call).toBeDefined();
    expect(
      call?.fields.some((f) => f.persistence_type === 'auth')
    ).toBe(true);
  });
});

describe('submitTalentService — happy path', () => {
  it('upserts talent_services + persists fields and returns talent_id+service_id', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { id: 't1', country_id: 'ar' },
      })
    );
    const result = await submitTalentService({
      service_id: 'svc-1',
      form_id: 'f1',
      form_data: {},
      resolved_form: makeForm([]),
    });
    expect(result).toEqual({
      data: { talent_id: 't1', service_id: 'svc-1' },
    });
    expect(mockedPersist).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 't1',
        context: { serviceSelect: { country_id: 'ar' } },
      })
    );
  });

  it('surfaces upsert error from talent_services', async () => {
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { id: 't1', country_id: 'ar' },
        upsertError: { message: 'unique violation' },
      })
    );
    const result = await submitTalentService({
      service_id: 'svc-1',
      form_id: 'f1',
      form_data: {},
      resolved_form: makeForm([]),
    });
    expect(result).toEqual({
      error: { _db: ['unique violation'] },
    });
  });

  it('surfaces persistFormData errors', async () => {
    mockedPersist.mockResolvedValue({
      ok: false,
      errors: [{ field: 'phone', message: 'required' }],
    });
    mockedCreate.mockReturnValue(
      makeSupabase({
        user: { id: 'u1' },
        profile: { id: 't1', country_id: 'ar' },
      })
    );
    const result = await submitTalentService({
      service_id: 'svc-1',
      form_id: 'f1',
      form_data: {},
      resolved_form: makeForm([]),
    });
    expect(result).toEqual({
      error: { _db: ['required'] },
    });
  });
});
