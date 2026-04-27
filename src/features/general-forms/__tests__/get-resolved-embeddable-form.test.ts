import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mockeamos las dependencias antes de importar el SUT.
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));
vi.mock('../actions/get-embeddable-form', () => ({
  getEmbeddableForm: vi.fn(),
}));
vi.mock('../actions/load-registration-form-labels', () => ({
  loadRegistrationFormLabels: vi.fn(),
}));
vi.mock('@/shared/lib/field-catalog/resolve-form-from-json', () => ({
  resolveFormFromJson: vi.fn(),
}));

import { getResolvedEmbeddableForm } from '../actions/get-resolved-embeddable-form';
import { getEmbeddableForm } from '../actions/get-embeddable-form';
import { loadRegistrationFormLabels } from '../actions/load-registration-form-labels';
import { resolveFormFromJson } from '@/shared/lib/field-catalog/resolve-form-from-json';
import { createClient } from '@/lib/supabase/server';

const mockedGetEmbeddable = vi.mocked(getEmbeddableForm);
const mockedLoadLabels = vi.mocked(loadRegistrationFormLabels);
const mockedResolve = vi.mocked(resolveFormFromJson);
const mockedCreateClient = vi.mocked(createClient);

beforeEach(() => {
  vi.clearAllMocks();
  mockedCreateClient.mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  } as never);
  mockedLoadLabels.mockResolvedValue({} as never);
});

function makeFormRow(schema: unknown) {
  return {
    id: 'form-1',
    target_role: 'talent' as const,
    schema,
  };
}

describe('getResolvedEmbeddableForm — passthrough reasons', () => {
  it('returns unknown-slug when getEmbeddableForm says so', async () => {
    mockedGetEmbeddable.mockResolvedValue({
      available: false,
      reason: 'unknown-slug',
    });
    const result = await getResolvedEmbeddableForm('foo', 'city-1', 'es');
    expect(result).toEqual({ available: false, reason: 'unknown-slug' });
  });

  it('returns city-not-configured', async () => {
    mockedGetEmbeddable.mockResolvedValue({
      available: false,
      reason: 'city-not-configured',
    });
    const result = await getResolvedEmbeddableForm('foo', 'city-1', 'es');
    expect(result).toEqual({ available: false, reason: 'city-not-configured' });
  });

  it('returns no-active-form', async () => {
    mockedGetEmbeddable.mockResolvedValue({
      available: false,
      reason: 'no-active-form',
    });
    const result = await getResolvedEmbeddableForm('foo', 'city-1', 'es');
    expect(result).toEqual({ available: false, reason: 'no-active-form' });
  });
});

describe('getResolvedEmbeddableForm — schema-level reasons', () => {
  it('detects legacy-schema before resolving', async () => {
    // Schema sin "steps" key → legacy.
    mockedGetEmbeddable.mockResolvedValue({
      available: true,
      form: makeFormRow({ legacy: true }) as never,
    });
    const result = await getResolvedEmbeddableForm('foo', 'city-1', 'es');
    expect(result).toEqual({ available: false, reason: 'legacy-schema' });
    expect(mockedResolve).not.toHaveBeenCalled();
  });

  it('detects empty-schema after resolving', async () => {
    mockedGetEmbeddable.mockResolvedValue({
      available: true,
      form: makeFormRow({ steps: [{ key: 's1', field_refs: [] }] }) as never,
    });
    mockedResolve.mockResolvedValue({ steps: [] });
    const result = await getResolvedEmbeddableForm('foo', 'city-1', 'es');
    expect(result).toEqual({ available: false, reason: 'empty-schema' });
  });
});

describe('getResolvedEmbeddableForm — happy path', () => {
  it('returns available with resolvedForm + meta', async () => {
    mockedGetEmbeddable.mockResolvedValue({
      available: true,
      form: makeFormRow({
        steps: [{ key: 's1', field_refs: [{ field_definition_id: 'fd-1' }] }],
      }) as never,
    });
    mockedResolve.mockResolvedValue({
      steps: [
        {
          key: 's1',
          label: 'Step 1',
          fields: [
            {
              field_definition_id: 'fd-1',
              key: 'k',
              input_type: 'text',
              persistence_type: 'form_response',
              persistence_target: null,
              required: false,
              label: 'L',
              placeholder: '',
              options: null,
              options_source: null,
            },
          ],
        },
      ],
    });
    const result = await getResolvedEmbeddableForm('foo', 'city-1', 'es');
    if (!result.available) throw new Error('expected available');
    expect(result.meta.formId).toBe('form-1');
    expect(result.meta.targetRole).toBe('talent');
    expect(result.resolvedForm.steps).toHaveLength(1);
  });
});
