import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
} from 'vitest';

// Capture chainable Postgrest builder so each test can choose what the
// final `await` returns. The chain emulates supabase-js semantics:
// .from(...).select(...).eq(...).not(...).order(...).eq(...).
const mockResolve = vi.fn();

function chain() {
  const b: Record<string, unknown> = {};
  b.select = vi.fn(() => b);
  b.eq = vi.fn(() => b);
  b.not = vi.fn(() => b);
  b.order = vi.fn(() => b);
  // Final await -> mockResolve
  (b as { then: (cb: (v: unknown) => unknown) => unknown }).then = (
    cb: (v: unknown) => unknown,
  ) => cb(mockResolve());
  return b;
}

const mockFrom = vi.fn(() => chain());

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({ from: mockFrom }),
}));

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
});

import {
  loadHomeServices,
  HOME_SERVICE_PLACEHOLDER,
} from '../load-home-services';

describe('loadHomeServices', () => {
  beforeEach(() => {
    mockResolve.mockReset();
    mockFrom.mockClear();
  });

  it('returns empty array when DB has no published services with category', async () => {
    mockResolve.mockReturnValue({ data: [], error: null });
    const result = await loadHomeServices('es', 'all');
    expect(result).toEqual([]);
  });

  it('throws when supabase returns an error', async () => {
    mockResolve.mockReturnValue({ data: null, error: { message: 'boom' } });
    await expect(loadHomeServices('es', 'all')).rejects.toBeTruthy();
  });

  it('maps a published service with a cover into a full card', async () => {
    mockResolve.mockReturnValue({
      data: [
        {
          id: 'svc1',
          slug: 'gastronomy',
          category: 'accompaniment',
          cover_image_url: 'services/svc1/cover',
          i18n: {
            es: { name: 'Gastronomía', benefits: ['a', 'b', 'c'] },
          },
        },
      ],
      error: null,
    });
    const result = await loadHomeServices('es', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Gastronomía');
    expect(result[0].imageSrc).toBe(
      'http://localhost:54321/storage/v1/object/public/service-images/services/svc1/cover-card.webp',
    );
    expect(result[0].bullets).toEqual(['a', 'b', 'c']);
    expect(result[0].tone).toBe('coral');
    expect(result[0].category).toBe('accompaniment');
  });

  it('falls back to placeholder when cover_image_url is null', async () => {
    mockResolve.mockReturnValue({
      data: [
        {
          id: 'svc1',
          slug: 's',
          category: 'home',
          cover_image_url: null,
          i18n: { es: { name: 'X', benefits: [] } },
        },
      ],
      error: null,
    });
    const [card] = await loadHomeServices('es', 'all');
    expect(card.imageSrc).toBe(HOME_SERVICE_PLACEHOLDER);
  });

  it('falls back to ES benefits when locale has benefits=[] (empty array)', async () => {
    mockResolve.mockReturnValue({
      data: [
        {
          id: 'svc1',
          slug: 's',
          category: 'home',
          cover_image_url: null,
          i18n: {
            es: { name: 'Nombre', benefits: ['x', 'y'] },
            en: { name: 'Name', benefits: [] },
          },
        },
      ],
      error: null,
    });
    const [card] = await loadHomeServices('en', 'all');
    expect(card.bullets).toEqual(['x', 'y']);
  });

  it('uses target benefits when locale has them populated', async () => {
    mockResolve.mockReturnValue({
      data: [
        {
          id: 'svc1',
          slug: 's',
          category: 'home',
          cover_image_url: null,
          i18n: {
            es: { name: 'Nombre', benefits: ['a'] },
            en: { name: 'Name', benefits: ['b', 'c'] },
          },
        },
      ],
      error: null,
    });
    const [card] = await loadHomeServices('en', 'all');
    expect(card.bullets).toEqual(['b', 'c']);
  });

  it('truncates benefits to the first 3 when more are present', async () => {
    mockResolve.mockReturnValue({
      data: [
        {
          id: 'svc1',
          slug: 's',
          category: 'home',
          cover_image_url: null,
          i18n: { es: { name: 'X', benefits: ['a', 'b', 'c', 'd', 'e'] } },
        },
      ],
      error: null,
    });
    const [card] = await loadHomeServices('es', 'all');
    expect(card.bullets).toEqual(['a', 'b', 'c']);
  });

  it('filters out empty / whitespace strings in benefits', async () => {
    mockResolve.mockReturnValue({
      data: [
        {
          id: 'svc1',
          slug: 's',
          category: 'home',
          cover_image_url: null,
          i18n: { es: { name: 'X', benefits: ['', '   ', 'a'] } },
        },
      ],
      error: null,
    });
    const [card] = await loadHomeServices('es', 'all');
    expect(card.bullets).toEqual(['a']);
  });

  it('alternates tone deterministically (coral, salmon, coral, ...)', async () => {
    mockResolve.mockReturnValue({
      data: Array.from({ length: 4 }, (_, i) => ({
        id: `s${i}`,
        slug: `s${i}`,
        category: 'home',
        cover_image_url: null,
        i18n: { es: { name: `n${i}`, benefits: [] } },
      })),
      error: null,
    });
    const result = await loadHomeServices('es', 'all');
    expect(result.map((r) => r.tone)).toEqual([
      'coral',
      'salmon',
      'coral',
      'salmon',
    ]);
  });

  it('applies .eq("category", filter) when filter is a specific category', async () => {
    mockResolve.mockReturnValue({ data: [], error: null });
    await loadHomeServices('es', 'accompaniment');
    // Find a chain instance whose `eq` was called with category filter
    const calls = mockFrom.mock.results
      .map((r) => r.value as Record<string, unknown>)
      .flatMap((b) =>
        ((b.eq as ReturnType<typeof vi.fn>).mock.calls as unknown[][]),
      );
    const hasCategoryFilter = calls.some(
      (args) => args[0] === 'category' && args[1] === 'accompaniment',
    );
    expect(hasCategoryFilter).toBe(true);
  });

  it('does NOT apply .eq("category", ...) when filter is "all"', async () => {
    mockResolve.mockReturnValue({ data: [], error: null });
    await loadHomeServices('es', 'all');
    const calls = mockFrom.mock.results
      .map((r) => r.value as Record<string, unknown>)
      .flatMap((b) =>
        ((b.eq as ReturnType<typeof vi.fn>).mock.calls as unknown[][]),
      );
    const hasCategoryFilter = calls.some((args) => args[0] === 'category');
    expect(hasCategoryFilter).toBe(false);
  });
});
