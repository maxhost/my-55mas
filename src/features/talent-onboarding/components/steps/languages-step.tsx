'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { saveLanguages } from '../../actions/save-languages';
import type { LanguagesSection, SpokenLanguageOption } from '../../types';

type Hints = {
  title: string;
  languagesLabel: string;
  atLeastOneLanguage: string;
  saveAndContinue: string;
  saveAndBackToSummary: string;
};

type Props = {
  initial: LanguagesSection;
  spokenLanguages: SpokenLanguageOption[];
  /** Locale from the URL path (e.g. 'es', 'en'). Used as a default checkbox when initial is empty. */
  defaultLanguageCode: string;
  mode: 'wizard' | 'edit';
  onSaved: () => void;
  hints: Hints;
};

export function LanguagesStep({
  initial,
  spokenLanguages,
  defaultLanguageCode,
  mode,
  onSaved,
  hints,
}: Props) {
  const [state, setState] = useState<LanguagesSection>(() => {
    if (initial.language_codes.length > 0) return initial;
    // Pre-fill the path locale only if it's a known spoken language
    const exists = spokenLanguages.some((l) => l.code === defaultLanguageCode);
    return {
      language_codes: exists ? [defaultLanguageCode] : [],
    };
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleLanguage = (code: string, checked: boolean) => {
    setState((s) => {
      if (checked) {
        if (s.language_codes.includes(code)) return s;
        return { language_codes: [...s.language_codes, code] };
      }
      return { language_codes: s.language_codes.filter((c) => c !== code) };
    });
  };

  const isEmpty = state.language_codes.length === 0;

  const submit = () => {
    setError(null);
    if (isEmpty) {
      setError(hints.atLeastOneLanguage);
      return;
    }
    startTransition(async () => {
      const result = await saveLanguages({ language_codes: state.language_codes });
      if ('error' in result) {
        setError(result.error.message);
        return;
      }
      onSaved();
    });
  };

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">{hints.title}</h2>

      <div className="space-y-2">
        <span className="text-sm font-medium">{hints.languagesLabel}</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {spokenLanguages.map((lang) => (
            <label
              key={lang.code}
              className="flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={state.language_codes.includes(lang.code)}
                onChange={(e) => toggleLanguage(lang.code, e.target.checked)}
                className="h-4 w-4"
              />
              <span>{lang.name}</span>
            </label>
          ))}
        </div>
        {isEmpty && (
          <p className="text-muted-foreground text-xs">
            {hints.atLeastOneLanguage}
          </p>
        )}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button onClick={submit} disabled={isPending} className="w-full">
        {isPending
          ? '…'
          : mode === 'edit'
            ? hints.saveAndBackToSummary
            : hints.saveAndContinue}
      </Button>
    </section>
  );
}
