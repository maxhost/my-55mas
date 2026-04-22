import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveForm } from '../resolve-form';
import type { CatalogFormSchema } from '../schema-types';
import type { Sb } from '../persistence/context';

vi.mock('../load-form-values', () => ({
  loadFormValues: vi.fn(async () => ({})),
}));

import { loadFormValues } from '../load-form-values';

// ── Supabase mock ───────────────────────────────────
// Chainable mock. Last resolved value is read from either .in() or .eq().

type PendingResult = { data: unknown[]; error: null | { message: string } };

function makeSupabase(
  definitionsResult: PendingResult,
  translationsResult: PendingResult
): Sb {
  const fromHandler = (table: string) => {
    if (table === 'form_field_definitions') {
      return {
        select: () => ({
          in: () => Promise.resolve(definitionsResult),
        }),
      };
    }
    if (table === 'form_field_definition_translations') {
      return {
        select: () => ({
          in: () => ({
            in: () => Promise.resolve(translationsResult),
          }),
        }),
      };
    }
    throw new Error(`Unexpected table: ${table}`);
  };
  return { from: fromHandler } as unknown as Sb;
}

const FIELD_A = '11111111-1111-1111-1111-111111111111';
const FIELD_B = '22222222-2222-2222-2222-222222222222';

const baseSchema: CatalogFormSchema = {
  steps: [
    {
      key: 'step1',
      field_refs: [
        { field_definition_id: FIELD_A, required: true },
        { field_definition_id: FIELD_B, required: false },
      ],
    },
  ],
};

const definitionsPayload = [
  {
    id: FIELD_A,
    group_id: 'g1',
    key: 'phone',
    input_type: 'text',
    persistence_type: 'db_column',
    persistence_target: { table: 'profiles', column: 'phone' },
    options: null,
    options_source: null,
    sort_order: 0,
    is_active: true,
  },
  {
    id: FIELD_B,
    group_id: 'g1',
    key: 'bio',
    input_type: 'textarea',
    persistence_type: 'form_response',
    persistence_target: null,
    options: null,
    options_source: null,
    sort_order: 1,
    is_active: true,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resolveForm', () => {
  it('combines definition + translation locale + current value', async () => {
    const translationsPayload = [
      {
        field_id: FIELD_A,
        locale: 'en',
        label: 'Phone',
        placeholder: 'Enter phone',
        description: null,
        option_labels: null,
      },
      {
        field_id: FIELD_B,
        locale: 'en',
        label: 'Bio',
        placeholder: '',
        description: 'Short bio',
        option_labels: null,
      },
    ];
    const sb = makeSupabase(
      { data: definitionsPayload, error: null },
      { data: translationsPayload, error: null }
    );
    vi.mocked(loadFormValues).mockResolvedValueOnce({
      [FIELD_A]: '+34600',
    });

    const result = await resolveForm({
      supabase: sb,
      schema: baseSchema,
      userId: 'user-1',
      locale: 'en',
    });

    expect(result.steps).toHaveLength(1);
    const fields = result.steps[0]!.fields;
    expect(fields).toHaveLength(2);
    expect(fields[0]?.key).toBe('phone');
    expect(fields[0]?.label).toBe('Phone');
    expect(fields[0]?.required).toBe(true);
    expect(fields[0]?.current_value).toBe('+34600');
    expect(fields[1]?.label).toBe('Bio');
    expect(fields[1]?.description).toBe('Short bio');
    expect(fields[1]?.current_value).toBeUndefined();
  });

  it('falls back to "es" translation when locale is missing', async () => {
    const translationsPayload = [
      {
        field_id: FIELD_A,
        locale: 'es',
        label: 'Teléfono',
        placeholder: null,
        description: null,
        option_labels: null,
      },
      // Note: no 'fr' for FIELD_A; FIELD_B only has 'fr'
      {
        field_id: FIELD_B,
        locale: 'fr',
        label: 'Biographie',
        placeholder: null,
        description: null,
        option_labels: null,
      },
      {
        field_id: FIELD_B,
        locale: 'es',
        label: 'Bio',
        placeholder: null,
        description: null,
        option_labels: null,
      },
    ];
    const sb = makeSupabase(
      { data: definitionsPayload, error: null },
      { data: translationsPayload, error: null }
    );
    const result = await resolveForm({
      supabase: sb,
      schema: baseSchema,
      userId: null,
      locale: 'fr',
    });
    const fields = result.steps[0]!.fields;
    expect(fields[0]?.label).toBe('Teléfono'); // fallback to es
    expect(fields[1]?.label).toBe('Biographie'); // exact locale match
  });

  it('skips loadFormValues when userId is null', async () => {
    const sb = makeSupabase(
      { data: definitionsPayload, error: null },
      {
        data: [
          {
            field_id: FIELD_A,
            locale: 'es',
            label: 'A',
            placeholder: null,
            description: null,
            option_labels: null,
          },
          {
            field_id: FIELD_B,
            locale: 'es',
            label: 'B',
            placeholder: null,
            description: null,
            option_labels: null,
          },
        ],
        error: null,
      }
    );
    await resolveForm({
      supabase: sb,
      schema: baseSchema,
      userId: null,
      locale: 'es',
    });
    expect(loadFormValues).toHaveBeenCalledWith(sb, null, expect.any(Array));
  });

  it('throws when a referenced field has no definition in DB', async () => {
    const sb = makeSupabase(
      { data: [definitionsPayload[0]], error: null }, // FIELD_B missing
      {
        data: [
          {
            field_id: FIELD_A,
            locale: 'es',
            label: 'A',
            placeholder: null,
            description: null,
            option_labels: null,
          },
        ],
        error: null,
      }
    );
    await expect(
      resolveForm({
        supabase: sb,
        schema: baseSchema,
        userId: null,
        locale: 'es',
      })
    ).rejects.toThrow(/22222222/);
  });

  it('uses empty label + warning fallback when no translation in locale or es', async () => {
    const sb = makeSupabase(
      { data: definitionsPayload, error: null },
      { data: [], error: null }
    );
    const result = await resolveForm({
      supabase: sb,
      schema: baseSchema,
      userId: null,
      locale: 'en',
    });
    const fields = result.steps[0]!.fields;
    // Label falls back to field.key when no translation found at all
    expect(fields[0]?.label).toBe('phone');
    expect(fields[1]?.label).toBe('bio');
  });

  // ── formLabels: step + action translations ──────────

  it('applies formLabels[step.key] as ResolvedStep.label', async () => {
    const sb = makeSupabase(
      { data: definitionsPayload, error: null },
      { data: [], error: null }
    );
    const result = await resolveForm({
      supabase: sb,
      schema: baseSchema,
      userId: null,
      locale: 'es',
      formLabels: { step1: 'Datos personales' },
    });
    expect(result.steps[0]?.label).toBe('Datos personales');
  });

  it('falls back ResolvedStep.label to step.key when formLabels missing', async () => {
    const sb = makeSupabase(
      { data: definitionsPayload, error: null },
      { data: [], error: null }
    );
    const result = await resolveForm({
      supabase: sb,
      schema: baseSchema,
      userId: null,
      locale: 'es',
      formLabels: {},
    });
    expect(result.steps[0]?.label).toBe('step1');
  });

  it('translates action labels via formLabels[action.key] with fallback', async () => {
    const schemaWithActions: CatalogFormSchema = {
      steps: [
        {
          key: 'step1',
          field_refs: [{ field_definition_id: FIELD_A, required: false }],
          actions: [
            { key: 'btn_next', type: 'next' },
            { key: 'btn_submit', type: 'submit' },
          ],
        },
      ],
    };
    const sb = makeSupabase(
      { data: [definitionsPayload[0]], error: null },
      { data: [], error: null }
    );
    const result = await resolveForm({
      supabase: sb,
      schema: schemaWithActions,
      userId: null,
      locale: 'es',
      formLabels: { btn_next: 'Continuar' },
    });
    const actions = result.steps[0]?.actions ?? [];
    expect(actions[0]?.label).toBe('Continuar');
    expect(actions[1]?.label).toBe('btn_submit'); // fallback to key
    expect(actions[0]?.type).toBe('next');
    expect(actions[1]?.type).toBe('submit');
  });

  it('returns undefined actions when step has none', async () => {
    const sb = makeSupabase(
      { data: definitionsPayload, error: null },
      { data: [], error: null }
    );
    const result = await resolveForm({
      supabase: sb,
      schema: baseSchema,
      userId: null,
      locale: 'es',
    });
    expect(result.steps[0]?.actions).toBeUndefined();
  });
});
