import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  writeServiceSelect,
  readServiceSelect,
} from '../persistence/service-select';
import { PersistenceError } from '../persistence/context';

// Helper: construye un mock supabase client que registra deletes e inserts.
// Las queries de talent_profiles devuelven { id: 'talent-1' } por default.
function makeSupabase(opts: {
  currentRows?: { service_id: string }[];
  deleteError?: { message: string };
  insertError?: { message: string };
  noTalentProfile?: boolean;
}) {
  const events: Array<
    | { type: 'select'; table: string }
    | { type: 'delete'; table: string; serviceIds?: string[] }
    | { type: 'insert'; table: string; rows: unknown[] }
  > = [];

  // Helper: thenable + chainable para queries .eq()(.eq())? .
  function makeSelectChain() {
    const result = { data: opts.currentRows ?? [], error: null };
    const promise = Promise.resolve(result);
    return {
      eq: () => makeSelectChain(),
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally.bind(promise),
    };
  }

  const fromMock = vi.fn().mockImplementation((table: string) => {
    if (table === 'talent_profiles') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: opts.noTalentProfile ? null : { id: 'talent-1' },
                error: null,
              }),
          }),
        }),
      };
    }
    if (table === 'talent_services') {
      return {
        select: () => {
          events.push({ type: 'select', table });
          return makeSelectChain();
        },
        delete: () => ({
          eq: () => ({
            eq: () => ({
              in: (_col: string, ids: string[]) => {
                events.push({ type: 'delete', table, serviceIds: ids });
                return Promise.resolve({
                  data: null,
                  error: opts.deleteError ?? null,
                });
              },
            }),
          }),
        }),
        insert: (rows: unknown[]) => {
          events.push({ type: 'insert', table, rows });
          return Promise.resolve({
            data: null,
            error: opts.insertError ?? null,
          });
        },
      };
    }
    throw new Error(`unexpected table: ${table}`);
  });

  return { sb: { from: fromMock } as never, events };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('writeServiceSelect — guards', () => {
  it('throws when country_id is missing', async () => {
    const { sb } = makeSupabase({});
    await expect(
      writeServiceSelect(sb, 'user-1', ['svc-A'], {} as never)
    ).rejects.toThrow(PersistenceError);
  });

  it('throws when talent_profiles row is missing', async () => {
    const { sb } = makeSupabase({ noTalentProfile: true });
    await expect(
      writeServiceSelect(sb, 'user-1', ['svc-A'], {
        country_id: 'ar',
      })
    ).rejects.toThrow(PersistenceError);
  });
});

describe('writeServiceSelect — idempotent diff-based behavior', () => {
  it('writes nothing when selection is identical to current rows', async () => {
    const { sb, events } = makeSupabase({
      currentRows: [{ service_id: 'A' }, { service_id: 'B' }],
    });
    await writeServiceSelect(sb, 'user-1', ['A', 'B'], {
      country_id: 'ar',
    });
    const writes = events.filter(
      (e) => e.type === 'insert' || e.type === 'delete'
    );
    expect(writes).toEqual([]);
  });

  it('inserts only the new services (toAdd) when adding', async () => {
    const { sb, events } = makeSupabase({
      currentRows: [{ service_id: 'A' }, { service_id: 'B' }],
    });
    await writeServiceSelect(sb, 'user-1', ['A', 'B', 'D'], {
      country_id: 'ar',
    });
    const inserts = events.filter((e) => e.type === 'insert');
    const deletes = events.filter((e) => e.type === 'delete');
    expect(deletes).toEqual([]);
    expect(inserts).toHaveLength(1);
    const rows = (inserts[0] as { rows: { service_id: string }[] }).rows;
    expect(rows.map((r) => r.service_id)).toEqual(['D']);
    expect(rows[0]).toMatchObject({
      talent_id: 'talent-1',
      country_id: 'ar',
      service_id: 'D',
      is_verified: false,
    });
  });

  it('deletes only the removed services (toRemove) when removing', async () => {
    const { sb, events } = makeSupabase({
      currentRows: [{ service_id: 'A' }, { service_id: 'B' }, { service_id: 'C' }],
    });
    await writeServiceSelect(sb, 'user-1', ['A', 'C'], { country_id: 'ar' });
    const deletes = events.filter((e) => e.type === 'delete');
    const inserts = events.filter((e) => e.type === 'insert');
    expect(inserts).toEqual([]);
    expect(deletes).toHaveLength(1);
    expect((deletes[0] as { serviceIds: string[] }).serviceIds).toEqual(['B']);
  });

  it('handles mixed add+remove: only diff applied', async () => {
    const { sb, events } = makeSupabase({
      currentRows: [{ service_id: 'A' }, { service_id: 'B' }, { service_id: 'C' }],
    });
    await writeServiceSelect(sb, 'user-1', ['A', 'C', 'D'], {
      country_id: 'ar',
    });
    const deletes = events.filter((e) => e.type === 'delete');
    const inserts = events.filter((e) => e.type === 'insert');
    expect(deletes).toHaveLength(1);
    expect(inserts).toHaveLength(1);
    expect((deletes[0] as { serviceIds: string[] }).serviceIds).toEqual(['B']);
    expect(
      (inserts[0] as { rows: { service_id: string }[] }).rows.map(
        (r) => r.service_id
      )
    ).toEqual(['D']);
  });

  it('clears all when given empty selection', async () => {
    const { sb, events } = makeSupabase({
      currentRows: [{ service_id: 'A' }, { service_id: 'B' }],
    });
    await writeServiceSelect(sb, 'user-1', [], { country_id: 'ar' });
    const deletes = events.filter((e) => e.type === 'delete');
    const inserts = events.filter((e) => e.type === 'insert');
    expect(inserts).toEqual([]);
    expect(deletes).toHaveLength(1);
    expect((deletes[0] as { serviceIds: string[] }).serviceIds.sort()).toEqual([
      'A',
      'B',
    ]);
  });

  it('inserts all when current rows are empty', async () => {
    const { sb, events } = makeSupabase({ currentRows: [] });
    await writeServiceSelect(sb, 'user-1', ['A', 'B'], { country_id: 'ar' });
    const inserts = events.filter((e) => e.type === 'insert');
    expect(inserts).toHaveLength(1);
    expect(
      (inserts[0] as { rows: { service_id: string }[] }).rows.map(
        (r) => r.service_id
      ).sort()
    ).toEqual(['A', 'B']);
  });

  it('surfaces delete errors as PersistenceError', async () => {
    const { sb } = makeSupabase({
      currentRows: [{ service_id: 'B' }],
      deleteError: { message: 'fk violation' },
    });
    await expect(
      writeServiceSelect(sb, 'user-1', ['A'], { country_id: 'ar' })
    ).rejects.toThrow(/fk violation/);
  });

  it('surfaces insert errors as PersistenceError', async () => {
    const { sb } = makeSupabase({
      currentRows: [],
      insertError: { message: 'unique violation' },
    });
    await expect(
      writeServiceSelect(sb, 'user-1', ['A'], { country_id: 'ar' })
    ).rejects.toThrow(/unique violation/);
  });
});

describe('readServiceSelect', () => {
  it('returns empty when no talent_profiles row', async () => {
    const { sb } = makeSupabase({ noTalentProfile: true });
    const result = await readServiceSelect(sb, 'user-1');
    expect(result).toEqual([]);
  });

  it('returns service_ids for the talent', async () => {
    const { sb } = makeSupabase({
      currentRows: [{ service_id: 'A' }, { service_id: 'B' }],
    });
    const result = await readServiceSelect(sb, 'user-1');
    expect(result.sort()).toEqual(['A', 'B']);
  });
});
