import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/lib/env';

export type TranslationTarget = 'en' | 'pt' | 'fr' | 'ca';

export const TARGET_LANG_NAMES: Record<TranslationTarget, string> = {
  en: 'English',
  pt: 'Portuguese',
  fr: 'French',
  ca: 'Catalan',
};

let cachedClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!cachedClient) {
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('translate-claude-missing-key');
    }
    cachedClient = new Anthropic({ apiKey });
  }
  return cachedClient;
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Find the first `tool_use` block in a Claude response that matches the
// expected tool name. Throws `translate-claude-malformed` if none is found
// (e.g. the model returned text instead of invoking the tool).
export function parseToolInput(
  response: Anthropic.Messages.Message,
  toolName: string,
): unknown {
  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === toolName) {
      return block.input;
    }
  }
  throw new Error('translate-claude-malformed');
}
