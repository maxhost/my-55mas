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

import {
  translateQuestionsTranslations,
  type QuestionTranslationItem,
} from '../translate-questions-with-claude';

const ITEMS: QuestionTranslationItem[] = [
  {
    key: 'experience',
    label: '¿Cuántos años de experiencia tienes?',
    placeholder: 'Ej: 5',
  },
  {
    key: 'lifestyle',
    label: '¿Qué estilo describe tu cocina?',
    help: 'Selecciona la opción que más se ajuste',
    options: [
      { value: 'home', label: 'Cocina casera' },
      { value: 'gourmet', label: 'Cocina gourmet' },
    ],
  },
];

const TRANSLATED_INPUT = {
  questions: [
    {
      key: 'experience',
      label: 'How many years of experience do you have?',
      placeholder: 'E.g. 5',
    },
    {
      key: 'lifestyle',
      label: 'Which style describes your cooking?',
      help: 'Pick the option that best fits',
      options: [
        { value: 'home', label: 'Home cooking' },
        { value: 'gourmet', label: 'Gourmet cooking' },
      ],
    },
  ],
};

function toolUseResponse(input: unknown) {
  return {
    content: [
      { type: 'tool_use', name: 'save_questions_translation', input },
    ],
  };
}

describe('translateQuestionsTranslations', () => {
  beforeEach(() => mockCreate.mockReset());

  it('returns early on empty input', async () => {
    const result = await translateQuestionsTranslations([], 'en');
    expect(result).toEqual([]);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('calls Claude with target language and max_tokens 8192', async () => {
    mockCreate.mockResolvedValue(toolUseResponse(TRANSLATED_INPUT));
    await translateQuestionsTranslations(ITEMS, 'en');
    const call = mockCreate.mock.calls[0][0];
    expect(call.model).toBe('claude-sonnet-4-6');
    expect(call.max_tokens).toBe(8192);
    expect(call.system).toContain('English');
    expect(call.tool_choice).toEqual({
      type: 'tool',
      name: 'save_questions_translation',
    });
  });

  it('wraps each question in <question> + <field>/<option> tags', async () => {
    mockCreate.mockResolvedValue(toolUseResponse(TRANSLATED_INPUT));
    await translateQuestionsTranslations(ITEMS, 'pt');
    const userMsg = mockCreate.mock.calls[0][0].messages[0].content;
    expect(userMsg).toContain('<question key="experience">');
    expect(userMsg).toContain('<field name="label">¿Cuántos años');
    expect(userMsg).toContain('<field name="placeholder">Ej: 5</field>');
    expect(userMsg).toContain('<question key="lifestyle">');
    expect(userMsg).toContain('<field name="help">Selecciona');
    expect(userMsg).toContain('<option value="home">Cocina casera</option>');
    expect(userMsg).toContain(
      '<option value="gourmet">Cocina gourmet</option>',
    );
  });

  it('omits placeholder/help/options when not present in the item', async () => {
    mockCreate.mockResolvedValue(
      toolUseResponse({
        questions: [{ key: 'k', label: 'Translated' }],
      }),
    );
    await translateQuestionsTranslations(
      [{ key: 'k', label: 'Hola' }],
      'fr',
    );
    const userMsg = mockCreate.mock.calls[0][0].messages[0].content;
    expect(userMsg).toContain('<field name="label">Hola</field>');
    expect(userMsg).not.toContain('placeholder');
    expect(userMsg).not.toContain('help');
    expect(userMsg).not.toContain('<option');
  });

  it('parses tool_use input and returns the translated items', async () => {
    mockCreate.mockResolvedValue(toolUseResponse(TRANSLATED_INPUT));
    const result = await translateQuestionsTranslations(ITEMS, 'en');
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('How many years of experience do you have?');
    expect(result[1].options).toEqual([
      { value: 'home', label: 'Home cooking' },
      { value: 'gourmet', label: 'Gourmet cooking' },
    ]);
  });

  it('throws translate-claude-malformed when no tool_use block exists', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'text', text: 'X' }] });
    await expect(translateQuestionsTranslations(ITEMS, 'en')).rejects.toThrow(
      'translate-claude-malformed',
    );
  });

  it('throws translate-claude-malformed when tool input fails Zod', async () => {
    mockCreate.mockResolvedValue(
      toolUseResponse({ questions: [{ key: 'x' }] }), // missing label
    );
    await expect(translateQuestionsTranslations(ITEMS, 'en')).rejects.toThrow(
      'translate-claude-malformed',
    );
  });
});
