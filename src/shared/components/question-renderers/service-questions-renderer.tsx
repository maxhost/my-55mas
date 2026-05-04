'use client';

import { Label } from '@/components/ui/label';
import { resolveOptions, resolveQuestionLabels } from '@/shared/lib/questions/resolve-options';
import type { AssignedSubtypeGroup, Question } from '@/shared/lib/questions/types';
import { TextInputRenderer } from './text-input';
import { TextareaRenderer } from './textarea';
import { NumberInputRenderer } from './number-input';
import { BooleanInputRenderer } from './boolean-input';
import { SelectInputRenderer } from './select-input';
import { MultiSelectInputRenderer } from './multi-select-input';
import { FileInputRenderer } from './file-input';

export type AnswersMap = Record<string, unknown>;

type Hints = {
  yes: string;
  no: string;
  fileTooLarge: string;
  fileWrongType: string;
};

type Props = {
  questions: Question[];
  answers: AnswersMap;
  onChange: (answers: AnswersMap) => void;
  errors?: Record<string, string | undefined>;
  locale: string;
  fallbackLocale?: string;
  assignedGroups: AssignedSubtypeGroup[];
  hints: Hints;
};

export function ServiceQuestionsRenderer({
  questions,
  answers,
  onChange,
  errors,
  locale,
  fallbackLocale = 'es',
  assignedGroups,
  hints,
}: Props) {
  if (questions.length === 0) return null;

  const updateAnswer = (key: string, value: unknown) => {
    onChange({ ...answers, [key]: value });
  };

  return (
    <div className="space-y-4">
      {questions.map((q) => {
        const id = `q-${q.key}`;
        const labels = resolveQuestionLabels(q, locale, fallbackLocale);
        const error = errors?.[q.key];
        const opts = resolveOptions(q, locale, fallbackLocale, assignedGroups);
        const value = answers[q.key];

        return (
          <div key={q.key} className="space-y-1.5">
            <Label htmlFor={id}>
              {labels.label}
              {q.required ? <span aria-hidden> *</span> : null}
            </Label>

            {q.type === 'text' && (
              <TextInputRenderer
                id={id}
                value={typeof value === 'string' ? value : ''}
                onChange={(v) => updateAnswer(q.key, v)}
                placeholder={labels.placeholder}
                required={q.required}
                hasError={Boolean(error)}
              />
            )}

            {q.type === 'multilineText' && (
              <TextareaRenderer
                id={id}
                value={typeof value === 'string' ? value : ''}
                onChange={(v) => updateAnswer(q.key, v)}
                placeholder={labels.placeholder}
                required={q.required}
                hasError={Boolean(error)}
              />
            )}

            {q.type === 'number' && (
              <NumberInputRenderer
                id={id}
                value={typeof value === 'number' ? value : null}
                onChange={(v) => updateAnswer(q.key, v)}
                placeholder={labels.placeholder}
                required={q.required}
                hasError={Boolean(error)}
              />
            )}

            {q.type === 'boolean' && (
              <BooleanInputRenderer
                id={id}
                value={typeof value === 'boolean' ? value : false}
                onChange={(v) => updateAnswer(q.key, v)}
                yesLabel={hints.yes}
                noLabel={hints.no}
              />
            )}

            {q.type === 'singleSelect' && (
              <SelectInputRenderer
                id={id}
                value={typeof value === 'string' ? value : ''}
                onChange={(v) => updateAnswer(q.key, v)}
                options={opts}
                placeholder={labels.placeholder}
                required={q.required}
                hasError={Boolean(error)}
              />
            )}

            {q.type === 'multiSelect' && (
              <MultiSelectInputRenderer
                id={id}
                value={Array.isArray(value) ? (value as string[]) : []}
                onChange={(v) => updateAnswer(q.key, v)}
                options={opts}
                hasError={Boolean(error)}
              />
            )}

            {q.type === 'file' && q.fileConfig && (
              <FileInputRenderer
                id={id}
                value={Array.isArray(value) ? (value as File[]) : []}
                onChange={(v) => updateAnswer(q.key, v)}
                config={q.fileConfig}
                required={q.required}
                hasError={Boolean(error)}
                errorTooLarge={hints.fileTooLarge}
                errorWrongType={hints.fileWrongType}
              />
            )}

            {labels.help && <p className="text-muted-foreground text-xs">{labels.help}</p>}
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>
        );
      })}
    </div>
  );
}
