'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { ServiceQuestionsRenderer } from '@/shared/components/question-renderers';
import { saveSurveyResponses } from '../../actions/save-survey-responses';
import type { SurveyQuestion, SurveyResponses } from '../../types';

type Hints = {
  title: string;
  description: string;
  noQuestions: string;
  saveAndContinue: string;
  saveAndBackToSummary: string;
  questionHints: {
    yes: string;
    no: string;
    fileTooLarge: string;
    fileWrongType: string;
  };
};

type Props = {
  initial: SurveyResponses;
  surveyQuestions: SurveyQuestion[];
  locale: string;
  mode: 'wizard' | 'edit';
  onSaved: () => void;
  hints: Hints;
};

export function SurveyStep({
  initial,
  surveyQuestions,
  locale,
  mode,
  onSaved,
  hints,
}: Props) {
  const [state, setState] = useState<SurveyResponses>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasQuestions = surveyQuestions.length > 0;

  const submit = () => {
    setError(null);

    // No questions configured by admin → skip the action and continue.
    if (!hasQuestions) {
      onSaved();
      return;
    }

    startTransition(async () => {
      const result = await saveSurveyResponses(state);
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
      {hints.description && (
        <p className="text-muted-foreground text-sm">{hints.description}</p>
      )}

      {hasQuestions ? (
        <ServiceQuestionsRenderer
          questions={surveyQuestions}
          answers={state}
          onChange={setState}
          locale={locale}
          assignedGroups={[]}
          hints={hints.questionHints}
        />
      ) : (
        <p className="text-muted-foreground text-sm">{hints.noQuestions}</p>
      )}

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
