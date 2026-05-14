import { describe, it, expect } from 'vitest';
import { saveReviewSchema } from '../schemas';

const BASE = {
  review: {
    author_name: 'María',
    author_photo: null,
    stars: 5,
    sort_order: 0,
    is_active: true,
    translations: { es: 'Excelente servicio' },
  },
};

describe('saveReviewSchema', () => {
  it('accepts a valid review', () => {
    expect(saveReviewSchema.safeParse(BASE).success).toBe(true);
  });

  it('accepts 0.5 step star values', () => {
    for (const stars of [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]) {
      const result = saveReviewSchema.safeParse({
        review: { ...BASE.review, stars },
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects stars outside 0.5..5 range', () => {
    expect(
      saveReviewSchema.safeParse({ review: { ...BASE.review, stars: 0 } }).success,
    ).toBe(false);
    expect(
      saveReviewSchema.safeParse({ review: { ...BASE.review, stars: 5.5 } }).success,
    ).toBe(false);
    expect(
      saveReviewSchema.safeParse({ review: { ...BASE.review, stars: -1 } }).success,
    ).toBe(false);
  });

  it('rejects stars that are not multiples of 0.5', () => {
    for (const stars of [0.3, 1.2, 2.7, 4.9]) {
      const result = saveReviewSchema.safeParse({
        review: { ...BASE.review, stars },
      });
      expect(result.success).toBe(false);
    }
  });

  it('rejects NaN and Infinity stars', () => {
    expect(
      saveReviewSchema.safeParse({ review: { ...BASE.review, stars: NaN } })
        .success,
    ).toBe(false);
    expect(
      saveReviewSchema.safeParse({
        review: { ...BASE.review, stars: Infinity },
      }).success,
    ).toBe(false);
  });

  it('requires at least one translation', () => {
    const result = saveReviewSchema.safeParse({
      review: { ...BASE.review, translations: {} },
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown locale keys in translations', () => {
    const result = saveReviewSchema.safeParse({
      review: { ...BASE.review, translations: { xx: 'invalid' } },
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty author_name', () => {
    const result = saveReviewSchema.safeParse({
      review: { ...BASE.review, author_name: '' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts nullable author_photo', () => {
    expect(
      saveReviewSchema.safeParse({
        review: { ...BASE.review, author_photo: null },
      }).success,
    ).toBe(true);
    expect(
      saveReviewSchema.safeParse({
        review: { ...BASE.review, author_photo: 'reviews/xyz/avatar' },
      }).success,
    ).toBe(true);
  });
});
