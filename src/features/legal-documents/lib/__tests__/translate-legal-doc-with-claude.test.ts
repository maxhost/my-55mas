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

import { translateLegalDocHtml } from '../translate-legal-doc-with-claude';

const SOURCE = '<p>Este es un documento legal.</p><h2>Sección 1</h2><p>Contenido importante.</p>';

const TRANSLATED = {
  html: '<p>This is a legal document.</p><h2>Section 1</h2><p>Important content.</p>',
};

function toolUseResponse(input: unknown) {
  return {
    content: [
      { type: 'tool_use', name: 'save_legal_doc_translation', input },
    ],
  };
}

describe('translateLegalDocHtml', () => {
  beforeEach(() => mockCreate.mockReset());

  it('calls Claude with target language, max_tokens 16000, and forced tool', async () => {
    mockCreate.mockResolvedValue(toolUseResponse(TRANSLATED));
    await translateLegalDocHtml(SOURCE, 'en');
    const call = mockCreate.mock.calls[0][0];
    expect(call.model).toBe('claude-sonnet-4-6');
    expect(call.max_tokens).toBe(16000);
    expect(call.system).toContain('English');
    expect(call.tool_choice).toEqual({
      type: 'tool',
      name: 'save_legal_doc_translation',
    });
  });

  it('system prompt enumerates the allowed tags', async () => {
    mockCreate.mockResolvedValue(toolUseResponse(TRANSLATED));
    await translateLegalDocHtml(SOURCE, 'pt');
    const system = mockCreate.mock.calls[0][0].system;
    expect(system).toContain('p, h2, h3, ul, ol, li, strong, em, u, a, br');
    expect(system).toContain('Preserve every tag');
  });

  it('wraps the HTML in a <document> envelope with target-locale comment', async () => {
    mockCreate.mockResolvedValue(toolUseResponse(TRANSLATED));
    await translateLegalDocHtml(SOURCE, 'fr');
    const userMsg = mockCreate.mock.calls[0][0].messages[0].content;
    expect(userMsg).toContain('<!-- target_locale: fr -->');
    expect(userMsg).toContain('<document>');
    expect(userMsg).toContain('</document>');
  });

  it('returns the translated HTML from the tool_use input', async () => {
    mockCreate.mockResolvedValue(toolUseResponse(TRANSLATED));
    const result = await translateLegalDocHtml(SOURCE, 'en');
    expect(result).toBe(TRANSLATED.html);
  });

  it('throws translate-claude-malformed when no tool_use block', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'text', text: 'x' }] });
    await expect(translateLegalDocHtml(SOURCE, 'en')).rejects.toThrow(
      'translate-claude-malformed',
    );
  });

  it('throws translate-claude-malformed when html field is missing', async () => {
    mockCreate.mockResolvedValue(toolUseResponse({ wrong: 'shape' }));
    await expect(translateLegalDocHtml(SOURCE, 'en')).rejects.toThrow(
      'translate-claude-malformed',
    );
  });
});
