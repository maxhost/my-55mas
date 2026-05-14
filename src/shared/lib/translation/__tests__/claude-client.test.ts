import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: { ANTHROPIC_API_KEY: 'test', ANTHROPIC_MODEL: 'm' },
}));

import { escapeXml, parseToolInput } from '../claude-client';

describe('escapeXml', () => {
  it('escapes &, < and >', () => {
    expect(escapeXml('foo & bar')).toBe('foo &amp; bar');
    expect(escapeXml('1 < 2')).toBe('1 &lt; 2');
    expect(escapeXml('a > b')).toBe('a &gt; b');
    expect(escapeXml('<tag>X&Y</tag>')).toBe('&lt;tag&gt;X&amp;Y&lt;/tag&gt;');
  });

  it('returns plain strings untouched', () => {
    expect(escapeXml('hello world')).toBe('hello world');
    expect(escapeXml('')).toBe('');
  });
});

describe('parseToolInput', () => {
  function makeResp(blocks: Array<Record<string, unknown>>) {
    return { content: blocks } as never;
  }

  it('returns the input of a matching tool_use block', () => {
    const resp = makeResp([
      { type: 'tool_use', name: 'save_translation', input: { name: 'X' } },
    ]);
    expect(parseToolInput(resp, 'save_translation')).toEqual({ name: 'X' });
  });

  it('throws translate-claude-malformed when no tool_use block matches', () => {
    const resp = makeResp([{ type: 'text', text: 'oops' }]);
    expect(() => parseToolInput(resp, 'save_translation')).toThrow(
      'translate-claude-malformed',
    );
  });

  it('throws when tool_use has a different name', () => {
    const resp = makeResp([
      { type: 'tool_use', name: 'other_tool', input: {} },
    ]);
    expect(() => parseToolInput(resp, 'save_translation')).toThrow(
      'translate-claude-malformed',
    );
  });

  it('picks the first matching tool_use when several exist', () => {
    const resp = makeResp([
      { type: 'text', text: 'preamble' },
      { type: 'tool_use', name: 'save_translation', input: { first: true } },
      { type: 'tool_use', name: 'save_translation', input: { second: true } },
    ]);
    expect(parseToolInput(resp, 'save_translation')).toEqual({ first: true });
  });
});
