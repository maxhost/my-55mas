'use client';

import { useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createHeadingNode,
  HeadingTagType,
} from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $setBlocksType } from '@lexical/selection';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  $createParagraphNode,
} from 'lexical';
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Pilcrow,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type ToolbarLabels = {
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

type Props = { labels: ToolbarLabels };

export function LexicalEditorToolbar({ labels }: Props) {
  const [editor] = useLexicalComposerContext();

  const formatText = (style: 'bold' | 'italic' | 'underline') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, style);
  };

  const setBlock = useCallback(
    (block: 'paragraph' | HeadingTagType) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        if (block === 'paragraph') {
          $setBlocksType(selection, () => $createParagraphNode());
        } else {
          $setBlocksType(selection, () => $createHeadingNode(block));
        }
      });
    },
    [editor],
  );

  const insertLink = useCallback(() => {
    const url = typeof window !== 'undefined'
      ? window.prompt(labels.linkPrompt, 'https://')
      : null;
    if (!url) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      return;
    }
    if (!/^(https?:\/\/|mailto:)/i.test(url)) return;
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
  }, [editor, labels.linkPrompt]);

  return (
    <div
      role="toolbar"
      aria-label="Editor"
      className="flex flex-wrap items-center gap-1 border-b border-input bg-muted/40 p-2"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatText('bold')}
        aria-label={labels.bold}
        title={labels.bold}
      >
        <Bold className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatText('italic')}
        aria-label={labels.italic}
        title={labels.italic}
      >
        <Italic className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatText('underline')}
        aria-label={labels.underline}
        title={labels.underline}
      >
        <Underline className="size-4" />
      </Button>

      <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setBlock('paragraph')}
        aria-label={labels.paragraph}
        title={labels.paragraph}
      >
        <Pilcrow className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setBlock('h2')}
        aria-label={labels.h2}
        title={labels.h2}
      >
        <Heading2 className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setBlock('h3')}
        aria-label={labels.h3}
        title={labels.h3}
      >
        <Heading3 className="size-4" />
      </Button>

      <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() =>
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
        }
        aria-label={labels.bulletList}
        title={labels.bulletList}
      >
        <List className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() =>
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
        }
        aria-label={labels.numberedList}
        title={labels.numberedList}
      >
        <ListOrdered className="size-4" />
      </Button>

      <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={insertLink}
        aria-label={labels.link}
        title={labels.link}
      >
        <LinkIcon className="size-4" />
      </Button>
    </div>
  );
}
