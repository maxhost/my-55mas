'use client';

import { useCallback, useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  LexicalEditor,
  type LexicalChangePayload,
  type LexicalEditorHandle,
} from '@/shared/components/lexical-editor';
import { locales } from '@/lib/i18n/config';
import type { LexicalState } from '@/shared/lib/lexical/types';
import { saveLegalDocument } from '../actions/save-legal-document';
import type {
  LegalDocument,
  LegalDocumentSlug,
  LegalDocumentTranslation,
} from '../types';

type Props = {
  doc: LegalDocument;
};

function buildInitialTranslations(
  doc: LegalDocument,
): Record<string, LegalDocumentTranslation> {
  const out: Record<string, LegalDocumentTranslation> = {};
  for (const locale of locales) {
    out[locale] = doc.translations[locale] ?? {
      lexicalState: null,
      richHtml: '',
    };
  }
  return out;
}

export function LegalDocumentEditor({ doc }: Props) {
  const t = useTranslations('AdminLegalDocuments');
  const tc = useTranslations('Common');
  const editorRef = useRef<LexicalEditorHandle | null>(null);
  const [translations, setTranslations] = useState<
    Record<string, LegalDocumentTranslation>
  >(() => buildInitialTranslations(doc));
  const [activeLocale, setActiveLocale] = useState<string>(locales[0]);
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState(doc.updated_at);
  const [isPending, startTransition] = useTransition();

  const toolbarLabels = {
    bold: t('toolbar.bold'),
    italic: t('toolbar.italic'),
    underline: t('toolbar.underline'),
    paragraph: t('toolbar.paragraph'),
    h2: t('toolbar.h2'),
    h3: t('toolbar.h3'),
    bulletList: t('toolbar.bulletList'),
    numberedList: t('toolbar.numberedList'),
    link: t('toolbar.link'),
    linkPrompt: t('toolbar.linkPrompt'),
  };

  const handleEditorChange = useCallback(
    (payload: LexicalChangePayload) => {
      setTranslations((prev) => ({
        ...prev,
        [activeLocale]: {
          lexicalState: payload.state as unknown as LexicalState,
          richHtml: payload.html,
        },
      }));
    },
    [activeLocale],
  );

  const handleTabChange = (next: string) => {
    if (next === activeLocale) return;
    // Force the debounced onChange to commit the active locale's latest
    // payload BEFORE we swap state — without this we'd lose the most
    // recent ~300ms of typing on tab change.
    editorRef.current?.flushOnChange();
    setActiveLocale(next);
  };

  const handleSave = () => {
    // Flush before save so the active tab's latest keystrokes are
    // included in the payload.
    editorRef.current?.flushOnChange();
    startTransition(async () => {
      const result = await saveLegalDocument({
        slug: doc.slug as LegalDocumentSlug,
        expectedUpdatedAt,
        translations,
      });
      if ('error' in result) {
        if (result.error === 'optimistic-lock') {
          toast.error(t('optimisticLockError'));
        } else if (result.error === 'invalid-input') {
          toast.error(t('invalidInputError'));
        } else {
          toast.error(t('saveError'));
        }
        return;
      }
      setExpectedUpdatedAt(result.data.updated_at);
      toast.success(t('savedSuccess'));
    });
  };

  const current = translations[activeLocale];

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{t('description')}</p>

      <Tabs value={activeLocale} onValueChange={handleTabChange}>
        <TabsList>
          {locales.map((locale) => (
            <TabsTrigger key={locale} value={locale}>
              {locale.toUpperCase()}
            </TabsTrigger>
          ))}
        </TabsList>

        {locales.map((locale) => (
          <TabsContent key={locale} value={locale} className="pt-3">
            {locale === activeLocale && (
              <LexicalEditor
                key={locale}
                initialState={current?.lexicalState ?? null}
                onChange={handleEditorChange}
                handleRef={editorRef}
                placeholder={t('placeholder')}
                ariaLabel={t('editorAriaLabel')}
                toolbarLabels={toolbarLabels}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? tc('saving') : tc('save')}
        </Button>
      </div>
    </div>
  );
}
