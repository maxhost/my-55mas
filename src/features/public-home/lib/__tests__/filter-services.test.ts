import { describe, it, expect } from 'vitest';
import { filterServices } from '../filter-services';
import type { HomeServiceCard } from '../load-home-services';

function card(
  over: Partial<HomeServiceCard> & Pick<HomeServiceCard, 'id'>,
): HomeServiceCard {
  return {
    id: over.id,
    slug: over.slug ?? over.id,
    category: over.category ?? 'classes',
    imageSrc: over.imageSrc ?? '/x.svg',
    imageAlt: over.imageAlt ?? 'x',
    title: over.title ?? 'Title',
    bullets: over.bullets ?? [],
    tone: over.tone ?? 'coral',
  };
}

const SERVICES: HomeServiceCard[] = [
  card({
    id: 'a',
    category: 'classes',
    title: 'Clases de cocina',
    bullets: ['Aprende recetas', 'Postres caseros'],
  }),
  card({
    id: 'b',
    category: 'accompaniment',
    title: 'Acompañamiento a mayores',
    bullets: ['Paseos', 'Conversación'],
  }),
  card({
    id: 'c',
    category: 'repairs',
    title: 'Reparaciones del hogar',
    bullets: ['Fontanería', 'Electricidad'],
  }),
];

describe('filterServices', () => {
  it('category "all" + empty query → all (same reference)', () => {
    const out = filterServices(SERVICES, 'all', '');
    expect(out).toBe(SERVICES);
  });

  it('specific category → only that category', () => {
    const out = filterServices(SERVICES, 'classes', '');
    expect(out.map((s) => s.id)).toEqual(['a']);
  });

  it('single token matches title, case + accent insensitive', () => {
    const out = filterServices(SERVICES, 'all', 'acompanamiento');
    expect(out.map((s) => s.id)).toEqual(['b']);
  });

  it('matches a bullet even when title does not match', () => {
    const out = filterServices(SERVICES, 'all', 'fontaneria');
    expect(out.map((s) => s.id)).toEqual(['c']);
  });

  it('multi-token query requires ALL tokens (AND)', () => {
    expect(filterServices(SERVICES, 'all', 'clases cocina').map((s) => s.id)).toEqual([
      'a',
    ]);
    expect(filterServices(SERVICES, 'all', 'clases xyz')).toEqual([]);
  });

  it('whitespace-only query does not filter', () => {
    const out = filterServices(SERVICES, 'all', '   ');
    expect(out).toBe(SERVICES);
  });

  it('category + query combine with AND', () => {
    expect(
      filterServices(SERVICES, 'classes', 'cocina').map((s) => s.id),
    ).toEqual(['a']);
    expect(filterServices(SERVICES, 'accompaniment', 'cocina')).toEqual([]);
  });

  it('no matches → empty array', () => {
    expect(filterServices(SERVICES, 'all', 'zzzznomatch')).toEqual([]);
  });
});
