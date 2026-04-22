import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadFormValues } from '../load-form-values';
import { persistFormData } from '../persist-form-data';
import type { ResolvedField } from '../resolved-types';
import type { Sb } from '../persistence/context';

// Mock all 6 adapter modules
vi.mock('../persistence/db-column', () => ({
  readDbColumn: vi.fn(async () => 'db-col-value'),
  writeDbColumn: vi.fn(async () => undefined),
}));
vi.mock('../persistence/auth', () => ({
  readAuth: vi.fn(async () => undefined),
  writeAuth: vi.fn(async () => ({ userId: 'new-user' })),
}));
vi.mock('../persistence/form-response', () => ({
  readFormResponse: vi.fn(async () => 'form-resp-value'),
  writeFormResponse: vi.fn(async () => undefined),
}));
vi.mock('../persistence/survey', () => ({
  readSurvey: vi.fn(async () => 'survey-value'),
  writeSurvey: vi.fn(async () => undefined),
}));
vi.mock('../persistence/service-select', () => ({
  readServiceSelect: vi.fn(async () => ['s1', 's2']),
  writeServiceSelect: vi.fn(async () => undefined),
}));
vi.mock('../persistence/subtype', () => ({
  readSubtype: vi.fn(async () => ['sub1']),
  writeSubtype: vi.fn(async () => undefined),
}));

import { readDbColumn, writeDbColumn } from '../persistence/db-column';
import { writeAuth } from '../persistence/auth';
import { readFormResponse, writeFormResponse } from '../persistence/form-response';
import { readSurvey, writeSurvey } from '../persistence/survey';
import { readServiceSelect, writeServiceSelect } from '../persistence/service-select';
import { readSubtype, writeSubtype } from '../persistence/subtype';

const sb = {} as Sb;

function makeField(
  overrides: Partial<ResolvedField> & Pick<ResolvedField, 'persistence_type'>
): ResolvedField {
  return {
    field_definition_id: 'fd-1',
    key: 'field_key',
    input_type: 'text',
    persistence_target: null,
    required: false,
    label: 'L',
    placeholder: '',
    options: null,
    options_source: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── loadFormValues ────────────────────────────────

describe('loadFormValues', () => {
  it('returns empty when userId is null', async () => {
    const result = await loadFormValues(sb, null, [
      makeField({ persistence_type: 'form_response' }),
    ]);
    expect(result).toEqual({});
  });

  it('dispatches to each adapter based on persistence_type', async () => {
    const fields: ResolvedField[] = [
      makeField({
        field_definition_id: 'fd-dbcol',
        persistence_type: 'db_column',
        persistence_target: { table: 'profiles', column: 'phone' },
      }),
      makeField({
        field_definition_id: 'fd-formresp',
        persistence_type: 'form_response',
      }),
      makeField({
        field_definition_id: 'fd-survey',
        persistence_type: 'survey',
        persistence_target: { survey_question_key: 'q1' },
      }),
      makeField({
        field_definition_id: 'fd-service',
        persistence_type: 'service_select',
      }),
      makeField({
        field_definition_id: 'fd-subtype',
        persistence_type: 'subtype',
        persistence_target: { subtype_group: 'cleaning' },
      }),
    ];
    const result = await loadFormValues(sb, 'user-1', fields);
    expect(readDbColumn).toHaveBeenCalled();
    expect(readFormResponse).toHaveBeenCalled();
    expect(readSurvey).toHaveBeenCalled();
    expect(readServiceSelect).toHaveBeenCalled();
    expect(readSubtype).toHaveBeenCalled();
    expect(result['fd-dbcol']).toBe('db-col-value');
    expect(result['fd-formresp']).toBe('form-resp-value');
    expect(result['fd-survey']).toBe('survey-value');
    expect(result['fd-service']).toEqual(['s1', 's2']);
    expect(result['fd-subtype']).toEqual(['sub1']);
  });

  it('skips auth fields (always undefined — filtered out)', async () => {
    const result = await loadFormValues(sb, 'user-1', [
      makeField({
        field_definition_id: 'fd-auth',
        persistence_type: 'auth',
        persistence_target: { auth_field: 'email' },
      }),
    ]);
    expect(result['fd-auth']).toBeUndefined();
  });
});

// ── persistFormData ───────────────────────────────

describe('persistFormData', () => {
  it('rejects when a required field is missing', async () => {
    const result = await persistFormData({
      supabase: sb,
      userId: 'user-1',
      fields: [
        makeField({
          key: 'phone',
          persistence_type: 'db_column',
          persistence_target: { table: 'profiles', column: 'phone' },
          required: true,
        }),
      ],
      formData: {},
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.field).toBe('phone');
    }
    expect(writeDbColumn).not.toHaveBeenCalled();
  });

  it('collects auth fields and calls signUp once', async () => {
    const result = await persistFormData({
      supabase: sb,
      userId: null,
      fields: [
        makeField({
          key: 'email',
          persistence_type: 'auth',
          persistence_target: { auth_field: 'email' },
        }),
        makeField({
          key: 'password',
          persistence_type: 'auth',
          persistence_target: { auth_field: 'password' },
        }),
      ],
      formData: { email: 'a@b.c', password: 'secret' },
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.userId).toBe('new-user');
    expect(writeAuth).toHaveBeenCalledTimes(1);
  });

  it('writes non-auth fields after signup using new userId', async () => {
    const result = await persistFormData({
      supabase: sb,
      userId: null,
      fields: [
        makeField({
          key: 'email',
          persistence_type: 'auth',
          persistence_target: { auth_field: 'email' },
        }),
        makeField({
          key: 'password',
          persistence_type: 'auth',
          persistence_target: { auth_field: 'password' },
        }),
        makeField({
          key: 'phone',
          persistence_type: 'db_column',
          persistence_target: { table: 'profiles', column: 'phone' },
        }),
      ],
      formData: {
        email: 'a@b.c',
        password: 'secret',
        phone: '+34600',
      },
    });
    expect(result.ok).toBe(true);
    expect(writeDbColumn).toHaveBeenCalledWith(
      sb,
      'new-user',
      '+34600',
      { table: 'profiles', column: 'phone' }
    );
  });

  it('throws when service_select field but no context.serviceSelect', async () => {
    const result = await persistFormData({
      supabase: sb,
      userId: 'user-1',
      fields: [
        makeField({
          key: 'services',
          persistence_type: 'service_select',
        }),
      ],
      formData: { services: ['s1'] },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.message).toMatch(/serviceSelect/);
    }
  });

  it('passes context.serviceSelect to adapter', async () => {
    await persistFormData({
      supabase: sb,
      userId: 'user-1',
      fields: [
        makeField({
          key: 'services',
          persistence_type: 'service_select',
        }),
      ],
      formData: { services: ['s1', 's2'] },
      context: { serviceSelect: { country_id: 'country-1' } },
    });
    expect(writeServiceSelect).toHaveBeenCalledWith(
      sb,
      'user-1',
      ['s1', 's2'],
      { country_id: 'country-1' }
    );
  });

  it('dispatches form_response, survey, subtype writes', async () => {
    await persistFormData({
      supabase: sb,
      userId: 'user-1',
      fields: [
        makeField({
          key: 'bio',
          field_definition_id: 'fd-bio',
          persistence_type: 'form_response',
        }),
        makeField({
          key: 'years',
          persistence_type: 'survey',
          persistence_target: { survey_question_key: 'experience_years' },
        }),
        makeField({
          key: 'subs',
          persistence_type: 'subtype',
          persistence_target: { subtype_group: 'cleaning' },
        }),
      ],
      formData: { bio: 'hola', years: '5', subs: ['id1', 'id2'] },
    });
    expect(writeFormResponse).toHaveBeenCalledWith(sb, 'user-1', 'fd-bio', 'hola');
    expect(writeSurvey).toHaveBeenCalledWith(
      sb,
      'user-1',
      '5',
      { survey_question_key: 'experience_years' }
    );
    expect(writeSubtype).toHaveBeenCalledWith(
      sb,
      'user-1',
      ['id1', 'id2'],
      { subtype_group: 'cleaning' }
    );
  });

  it('returns ok: false when no userId (no auth fields either)', async () => {
    const result = await persistFormData({
      supabase: sb,
      userId: null,
      fields: [
        makeField({
          key: 'bio',
          persistence_type: 'form_response',
        }),
      ],
      formData: { bio: 'x' },
    });
    expect(result.ok).toBe(false);
  });
});
