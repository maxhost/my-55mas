// Public API for the shared rich-text editor. Imported only by admin
// surfaces — the public site uses pre-sanitized `richHtml` directly.

import dynamic from 'next/dynamic';
import { EditorSkeleton } from './editor-skeleton';

// Lexical depends on DOM APIs at construct time (`document`, `Selection`),
// so we bypass SSR entirely. The page RSC renders the skeleton; the
// editor mounts after hydration.
export const LexicalEditor = dynamic(
  () => import('./lexical-editor').then((m) => m.LexicalEditor),
  { ssr: false, loading: () => <EditorSkeleton /> },
);

export { EditorSkeleton };
export type {
  LexicalEditorProps,
  LexicalEditorHandle,
  LexicalChangePayload,
} from './lexical-editor';
