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

import { translateFaqsTranslations } from '../translate-faqs-with-claude';

const ITEMS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    question: '¿Cómo funciona?',
    answer: 'Funciona así y asá.',
  },
];

const TRANSLATED = {
  faqs: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      question: 'How does it work?',
      answer: 'It works like this.',
    },
  ],
};

function toolUseResponse(input: unknown) {
  return {
    content: [
      { type: 'tool_use', name: 'save_faqs_translation', input },
    ],
  };
}

describe('translateFaqsTranslations', () => {
  beforeEach(() => mockCreate.mockReset());

  it('returns early on empty input', async () => {
    const result = await translateFaqsTranslations([], 'en');
    expect(result).toEqual([]);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('calls Claude with the configured model + target language', async () => {
    mockCreate.mockResolvedValue(toolUseResponse(TRANSLATED));
    await translateFaqsTranslations(ITEMS, 'fr');
    const call = mockCreate.mock.calls[0][0];
    expect(call.model).toBe('claude-sonnet-4-6');
    expect(call.max_tokens).toBe(8192);
    expect(call.system).toContain('French');
    expect(call.tool_choice).toEqual({
      type: 'tool',
      name: 'save_faqs_translation',
    });
  });

  it('wraps each FAQ in <faq id> + <field name="question"|"answer">', async () => {
    mockCreate.mockResolvedValue(toolUseResponse(TRANSLATED));
    await translateFaqsTranslations(ITEMS, 'pt');
    const userMsg = mockCreate.mock.calls[0][0].messages[0].content;
    expect(userMsg).toContain(
      '<faq id="00000000-0000-0000-0000-000000000001">',
    );
    expect(userMsg).toContain('<field name="question">¿Cómo funciona?</field>');
    expect(userMsg).toContain('<field name="answer">Funciona así y asá.</field>');
  });

  it('parses tool_use input and returns translated FAQs', async () => {
    mockCreate.mockResolvedValue(toolUseResponse(TRANSLATED));
    const result = await translateFaqsTranslations(ITEMS, 'en');
    expect(result).toHaveLength(1);
    expect(result[0].question).toBe('How does it work?');
    expect(result[0].answer).toBe('It works like this.');
  });

  it('throws translate-claude-malformed when no tool_use block', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'text', text: 'x' }] });
    await expect(translateFaqsTranslations(ITEMS, 'en')).rejects.toThrow(
      'translate-claude-malformed',
    );
  });

  it('throws translate-claude-malformed on Zod validation failure', async () => {
    mockCreate.mockResolvedValue(
      toolUseResponse({
        faqs: [{ id: 'not-uuid', question: 'X', answer: 'Y' }],
      }),
    );
    await expect(translateFaqsTranslations(ITEMS, 'en')).rejects.toThrow(
      'translate-claude-malformed',
    );
  });
});
