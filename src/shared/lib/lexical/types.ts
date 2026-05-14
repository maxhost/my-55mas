import { z } from 'zod';

// Lexical's `editor.getEditorState().toJSON()` always emits `{ root: {...} }`.
// We validate presence of `root` only and pass through any nested keys so
// future Lexical bumps (which may add fields) don't break stored state.
export const lexicalStateSchema = z
  .object({ root: z.record(z.string(), z.unknown()) })
  .passthrough();

export type LexicalState = z.infer<typeof lexicalStateSchema>;
