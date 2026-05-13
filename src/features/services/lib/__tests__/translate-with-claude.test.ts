import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));
vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = { create: mockCreate };
  }
  return { default: MockAnthropic };
});

vi.mock('@/lib/env', () => ({
  env: {
    ANTHROPIC_API_KEY: 'test-key',
    ANTHROPIC_MODEL: 'claude-sonnet-4-6',
  },
}));

import { translateServiceTranslation } from '../translate-with-claude';

const SOURCE = {
  name: 'Acompañamiento',
  description: 'Servicio de acompañamiento profesional',
  includes: '',
  hero_title: 'Acompañamiento profesional',
  hero_subtitle: '',
  benefits: ['Bienestar', 'Cuidado'],
  guarantees: [],
  faqs: [{ question: '¿Cuánto cuesta?', answer: '$50/h' }],
};

const TRANSLATED_INPUT = {
  name: 'Companionship',
  description: 'Professional companionship service',
  hero_title: 'Professional companionship',
  benefits: ['Wellbeing', 'Care'],
  faqs: [{ question: 'How much?', answer: '$50/h' }],
};

function toolUseResponse(input: unknown) {
  return {
    content: [
      { type: 'tool_use', name: 'save_translation', input },
    ],
  };
}

describe('translateServiceTranslation', () => {
  beforeEach(() => mockCreate.mockReset());

  it('calls Claude with the configured model and target language', async () => {
    mockCreate.mockResolvedValue(toolUseResponse(TRANSLATED_INPUT));
    await translateServiceTranslation(SOURCE, 'en');
    const call = mockCreate.mock.calls[0][0];
    expect(call.model).toBe('claude-sonnet-4-6');
    expect(call.system).toContain('English');
    expect(call.tool_choice).toEqual({
      type: 'tool',
      name: 'save_translation',
    });
  });

  it('wraps non-empty fields in <field> tags and omits empty ones', async () => {
    mockCreate.mockResolvedValue(toolUseResponse(TRANSLATED_INPUT));
    await translateServiceTranslation(SOURCE, 'pt');
    const userMsg = mockCreate.mock.calls[0][0].messages[0].content;
    expect(userMsg).toContain('<field name="name">Acompañamiento</field>');
    expect(userMsg).toContain('<field name="description">');
    expect(userMsg).toContain('<field name="hero_title">');
    expect(userMsg).not.toContain('<field name="includes">');
    expect(userMsg).not.toContain('<field name="hero_subtitle">');
    expect(userMsg).toContain('<field name="benefits[0]">Bienestar</field>');
    expect(userMsg).not.toContain('<field name="guarantees');
    expect(userMsg).toContain('<field name="faqs[0].question">');
    expect(userMsg).toContain('<field name="faqs[0].answer">');
  });

  it('escapes XML special chars in field content', async () => {
    mockCreate.mockResolvedValue(toolUseResponse(TRANSLATED_INPUT));
    await translateServiceTranslation(
      { ...SOURCE, description: 'X & Y < Z > W' },
      'en',
    );
    const userMsg = mockCreate.mock.calls[0][0].messages[0].content;
    expect(userMsg).toContain('X &amp; Y &lt; Z &gt; W');
    expect(userMsg).not.toContain('X & Y < Z > W');
  });

  it('parses the tool_use block and normalizes missing optional fields', async () => {
    mockCreate.mockResolvedValue(toolUseResponse(TRANSLATED_INPUT));
    const result = await translateServiceTranslation(SOURCE, 'fr');
    expect(result.name).toBe('Companionship');
    expect(result.benefits).toEqual(['Wellbeing', 'Care']);
    // Optional missing in LLM response → empty defaults
    expect(result.includes).toBe('');
    expect(result.hero_subtitle).toBe('');
    expect(result.guarantees).toEqual([]);
  });

  it('throws translate-claude-malformed when response has no tool_use block', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'text', text: 'oops' }] });
    await expect(translateServiceTranslation(SOURCE, 'en')).rejects.toThrow(
      'translate-claude-malformed',
    );
  });

  it('throws translate-claude-malformed when tool input fails Zod', async () => {
    // Missing required `name`
    mockCreate.mockResolvedValue(toolUseResponse({ description: 'X' }));
    await expect(translateServiceTranslation(SOURCE, 'en')).rejects.toThrow(
      'translate-claude-malformed',
    );
  });
});
