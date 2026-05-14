'use client';

import { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot } from 'lexical';
import type { EditorState, LexicalEditor as LexicalEditorInstance } from 'lexical';
import { LexicalEditorToolbar } from './lexical-editor-toolbar';

export type LexicalChangePayload = {
  state: Record<string, unknown>;
  html: string;
};

export type LexicalEditorHandle = {
  /** Force the debounced onChange callback to fire synchronously. Useful
   *  before swapping editor state (e.g. changing locale tab) to avoid
   *  losing buffered keystrokes. */
  flushOnChange: () => void;
};

export type LexicalEditorProps = {
  /** Initial editor state. `null` falls through to `initialHtml`; if
   *  both are absent, renders an empty document. */
  initialState: Record<string, unknown> | null;
  /** HTML used as the fallback source when `initialState` is null or
   *  corrupt. Useful after AI translation, which writes the translated
   *  richHtml but no Lexical state. The editor parses the HTML into
   *  nodes on mount; the next onChange emits a fresh state. */
  initialHtml?: string | null;
  onChange: (payload: LexicalChangePayload) => void;
  /** Imperative handle to flush onChange before unmount/state swap. */
  handleRef?: React.RefObject<LexicalEditorHandle | null>;
  placeholder?: string;
  ariaLabel?: string;
  toolbarLabels: {
    bold: string;
    italic: string;
    underline: string;
    paragraph: string;
    h2: string;
    h3: string;
    bulletList: string;
    numberedList: string;
    link: string;
    linkPrompt: string;
  };
};

const EDITOR_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
];

const EDITOR_THEME = {
  paragraph: 'mb-2',
  heading: {
    h2: 'mb-3 text-xl font-bold',
    h3: 'mb-2 text-lg font-semibold',
  },
  list: {
    ul: 'mb-2 list-disc pl-6',
    ol: 'mb-2 list-decimal pl-6',
    listitem: 'mb-1',
  },
  link: 'text-brand-coral underline',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
};

// Inner change plugin: debounces 300ms and exposes a flush() helper via
// the parent's ref so tab swaps can force the buffered payload through
// before unmounting.
function ChangePlugin({
  onChange,
  handleRef,
}: {
  onChange: (p: LexicalChangePayload) => void;
  handleRef?: React.RefObject<LexicalEditorHandle | null>;
}) {
  const [editor] = useLexicalComposerContext();
  const latestPayload = useRef<LexicalChangePayload | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (latestPayload.current) {
      onChange(latestPayload.current);
      latestPayload.current = null;
    }
  };

  useImperativeHandle(handleRef, () => ({ flushOnChange: flush }), [
    handleRef,
  ]);

  const handleEditorChange = (state: EditorState) => {
    let html = '';
    state.read(() => {
      html = $generateHtmlFromNodes(editor, null);
    });
    latestPayload.current = {
      state: state.toJSON() as unknown as Record<string, unknown>,
      html,
    };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, 300);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return <OnChangePlugin onChange={handleEditorChange} />;
}

// Plugin that loads initial state into the editor on mount and when
// `state` or `html` reference changes (used by tab-swap pattern).
// Preference order: state > html > empty.
function InitialStatePlugin({
  state,
  html,
}: {
  state: Record<string, unknown> | null;
  html: string | null;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (state) {
      try {
        const parsed = editor.parseEditorState(JSON.stringify(state));
        editor.setEditorState(parsed);
        return;
      } catch {
        // Fall through to HTML path.
      }
    }
    if (html && html.trim()) {
      editor.update(() => {
        const dom = new DOMParser().parseFromString(html, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        const root = $getRoot();
        root.clear();
        root.append(...nodes);
      });
      return;
    }
    // No state and no html: explicit reset so re-mounts don't carry
    // over stale content from a previous tab.
    editor.update(() => {
      $getRoot().clear();
    });
  }, [editor, state, html]);

  return null;
}

export function LexicalEditor({
  initialState,
  initialHtml,
  onChange,
  handleRef,
  placeholder,
  ariaLabel,
  toolbarLabels,
}: LexicalEditorProps) {
  const initialConfig = useMemo(
    () => ({
      namespace: 'admin-lexical-editor',
      theme: EDITOR_THEME,
      nodes: EDITOR_NODES,
      onError(error: Error, _editor: LexicalEditorInstance) {
        // Console-only — the editor's ErrorBoundary handles UI fallback.
        // eslint-disable-next-line no-console
        console.error('[LexicalEditor]', error);
      },
      // Don't set editorState here — InitialStatePlugin handles it so we
      // can react to `initialState` reference changes (tab swap).
    }),
    [],
  );

  return (
    <div className="rounded-md border border-input bg-background">
      <LexicalComposer initialConfig={initialConfig}>
        <LexicalEditorToolbar labels={toolbarLabels} />
        <div className="relative px-3 py-2">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                aria-label={ariaLabel}
                className="min-h-[240px] outline-none [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold"
              />
            }
            placeholder={
              <div className="pointer-events-none absolute left-3 top-2 text-muted-foreground">
                {placeholder ?? ''}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <InitialStatePlugin state={initialState} html={initialHtml ?? null} />
        <ChangePlugin onChange={onChange} handleRef={handleRef} />
      </LexicalComposer>
    </div>
  );
}
