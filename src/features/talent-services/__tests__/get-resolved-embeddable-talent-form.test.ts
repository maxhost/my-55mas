import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));
vi.mock('../actions/get-embeddable-talent-form', () => ({
  getEmbeddableTalentForm: vi.fn(),
}));
vi.mock('../actions/load-talent-form-labels', () => ({
  loadTalentFormLabels: vi.fn(),
}));
vi.mock('@/shared/lib/field-catalog/resolve-form-from-json', () => ({
  resolveFormFromJson: vi.fn(),
}));

import { getResolvedEmbeddableTalentForm } from '../actions/get-resolved-embeddable-talent-form';
import { getEmbeddableTalentForm } from '../actions/get-embeddable-talent-form';
import { loadTalentFormLabels } from '../actions/load-talent-form-labels';
import { resolveFormFromJson } from '@/shared/lib/field-catalog/resolve-form-from-json';
import { createClient } from '@/lib/supabase/server';

const mockedGetEmbeddable = vi.mocked(getEmbeddableTalentForm);
const mockedLoadLabels = vi.mocked(loadTalentFormLabels);
const mockedResolve = vi.mocked(resolveFormFromJson);
const mockedCreateClient = vi.mocked(createClient);

beforeEach(() => {
  vi.clearAllMocks();
  mockedCreateClient.mockReturnValue({} as never);
  mockedLoadLabels.mockResolvedValue({} as never);
});

describe('getResolvedEmbeddableTalentForm — passthrough reasons', () => {
  it('passes unknown-slug', async () => {
    mockedGetEmbeddable.mockResolvedValue({
      available: false,
      reason: 'unknown-slug',
    });
    const result = await getResolvedEmbeddableTalentForm(
      'foo',
      null,
      'es',
      'user-1'
    );
    expect(result).toEqual({ available: false, reason: 'unknown-slug' });
  });

  it('passes service-not-active', async () => {
    mockedGetEmbeddable.mockResolvedValue({
      available: false,
      reason: 'service-not-active',
    });
    const result = await getResolvedEmbeddableTalentForm(
      'foo',
      'city-1',
      'es',
      'user-1'
    );
    expect(result).toEqual({ available: false, reason: 'service-not-active' });
  });

  it('passes no-active-form', async () => {
    mockedGetEmbeddable.mockResolvedValue({
      available: false,
      reason: 'no-active-form',
    });
    const result = await getResolvedEmbeddableTalentForm(
      'foo',
      null,
      'es',
      null
    );
    expect(result).toEqual({ available: false, reason: 'no-active-form' });
  });
});

describe('getResolvedEmbeddableTalentForm — schema reasons', () => {
  it('detects legacy-schema before resolving', async () => {
    mockedGetEmbeddable.mockResolvedValue({
      available: true,
      service_id: 'svc-1',
      form: { id: 'f1', schema: { wrong_shape: true } } as never,
    });
    const result = await getResolvedEmbeddableTalentForm(
      'foo',
      null,
      'es',
      'user-1'
    );
    expect(result).toEqual({ available: false, reason: 'legacy-schema' });
    expect(mockedResolve).not.toHaveBeenCalled();
  });

  it('detects empty-schema after resolving', async () => {
    mockedGetEmbeddable.mockResolvedValue({
      available: true,
      service_id: 'svc-1',
      form: {
        id: 'f1',
        schema: { steps: [{ key: 's1', field_refs: [] }] },
      } as never,
    });
    mockedResolve.mockResolvedValue({ steps: [] });
    const result = await getResolvedEmbeddableTalentForm(
      'foo',
      null,
      'es',
      'user-1'
    );
    expect(result).toEqual({ available: false, reason: 'empty-schema' });
  });
});

describe('getResolvedEmbeddableTalentForm — happy path', () => {
  it('returns available with formId + serviceId', async () => {
    mockedGetEmbeddable.mockResolvedValue({
      available: true,
      service_id: 'svc-7',
      form: {
        id: 'form-7',
        schema: { steps: [{ key: 's1', field_refs: [{ field_definition_id: 'fd' }] }] },
      } as never,
    });
    mockedResolve.mockResolvedValue({
      steps: [
        {
          key: 's1',
          label: 'Step 1',
          fields: [
            {
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
            },
          ],
        },
      ],
    });
    const result = await getResolvedEmbeddableTalentForm(
      'plomeria',
      'city-1',
      'es',
      'user-7'
    );
    if (!result.available) throw new Error('expected available');
    expect(result.meta).toEqual({ formId: 'form-7', serviceId: 'svc-7' });
    expect(result.resolvedForm.steps).toHaveLength(1);
  });

  it('passes userId through to resolveFormFromJson', async () => {
    mockedGetEmbeddable.mockResolvedValue({
      available: true,
      service_id: 'svc-1',
      form: { id: 'f1', schema: { steps: [] } } as never,
    });
    mockedResolve.mockResolvedValue({
      steps: [
        {
          key: 's1',
          label: 'S',
          fields: [
            {
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
            },
          ],
        },
      ],
    });
    await getResolvedEmbeddableTalentForm('foo', null, 'es', 'user-special');
    expect(mockedResolve).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-special' })
    );
  });
});
