import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));
vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = { create: mockCreate };
  }
  return { default: MockAnthropic };
});

vi.mock('@/lib/env', () => ({
  env: { ANTHROPIC_API_KEY: 'test-key', ANTHROPIC_MODEL: 'claude-sonnet-4-6' },
}));

import { translateReviewsTranslations } from '../translate-reviews-with-claude';

const ITEMS = [
  { id: '00000000-0000-0000-0000-000000000001', text: 'Excelente servicio' },
  { id: '00000000-0000-0000-0000-000000000002', text: 'Muy recomendable' },
];

const TRANSLATED = {
  reviews: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      text: 'Excellent service',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      text: 'Highly recommended',
    },
  ],
};

function toolUseResponse(input: unknown) {
  return {
    content: [
      { type: 'tool_use', name: 'save_reviews_translation', input },
    ],
  };
}

describe('translateReviewsTranslations', () => {
  beforeEach(() => mockCreate.mockReset());

  it('returns early on empty input', async () => {
    const result = await translateReviewsTranslations([], 'en');
    expect(result).toEqual([]);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('calls Claude with target language and max_tokens 8192', async () => {
    mockCreate.mockResolvedValue(toolUseResponse(TRANSLATED));
    await translateReviewsTranslations(ITEMS, 'en');
    const call = mockCreate.mock.calls[0][0];
    expect(call.model).toBe('claude-sonnet-4-6');
    expect(call.max_tokens).toBe(8192);
    expect(call.system).toContain('English');
    expect(call.tool_choice).toEqual({
      type: 'tool',
      name: 'save_reviews_translation',
    });
  });

  it('wraps each review in <review id> + <field name="text">', async () => {
    mockCreate.mockResolvedValue(toolUseResponse(TRANSLATED));
    await translateReviewsTranslations(ITEMS, 'pt');
    const userMsg = mockCreate.mock.calls[0][0].messages[0].content;
    expect(userMsg).toContain(
      '<review id="00000000-0000-0000-0000-000000000001">',
    );
    expect(userMsg).toContain(
      '<field name="text">Excelente servicio</field>',
    );
    expect(userMsg).toContain(
      '<review id="00000000-0000-0000-0000-000000000002">',
    );
  });

  it('parses tool_use input and returns translated reviews', async () => {
    mockCreate.mockResolvedValue(toolUseResponse(TRANSLATED));
    const result = await translateReviewsTranslations(ITEMS, 'en');
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe('Excellent service');
    expect(result[1].text).toBe('Highly recommended');
  });

  it('throws translate-claude-malformed when no tool_use block', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'text', text: 'x' }] });
    await expect(translateReviewsTranslations(ITEMS, 'en')).rejects.toThrow(
      'translate-claude-malformed',
    );
  });

  it('throws translate-claude-malformed on Zod validation failure', async () => {
    mockCreate.mockResolvedValue(
      toolUseResponse({ reviews: [{ id: 'not-uuid', text: 'x' }] }),
    );
    await expect(translateReviewsTranslations(ITEMS, 'en')).rejects.toThrow(
      'translate-claude-malformed',
    );
  });
});
