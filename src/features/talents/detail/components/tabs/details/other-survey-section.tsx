'use client';

import { useEffect } from 'react';
import type {
  DetailsTabHints,
  SurveyValues,
  TalentDetailContext,
} from '../../../types';
import { SectionShell } from './details-tab';

type Props = {
  talentId: string;
  data: SurveyValues;
  context: TalentDetailContext;
  hints: DetailsTabHints;
  locale: string;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
};

export function OtherSurveySection({
  data,
  context,
  hints,
  locale,
  open,
  onToggle,
  onDirtyChange,
}: Props) {
  // This section is read-only for now (edit mode is out of scope).
  useEffect(() => {
    onDirtyChange(false);
  }, [onDirtyChange]);

  const questions = context.surveyQuestions ?? [];

  const previewText = (() => {
    const answeredCount = questions.filter((q) => {
      const v = data[q.key];
      return v !== null && v !== undefined && v !== '';
    }).length;
    return answeredCount === 0 ? hints.empty : `${answeredCount} / ${questions.length}`;
  })();

  const readMode =
    questions.length === 0 ? (
      <p className="text-sm text-muted-foreground">{hints.empty}</p>
    ) : (
      <dl className="flex flex-col gap-3">
        {questions.map((q) => {
          const label = q.i18n[locale]?.label ?? q.i18n.es?.label ?? q.key;
          const raw = data[q.key];
          const value = formatAnswer(raw);
          return (
            <div key={q.key} className="flex flex-col">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-sm whitespace-pre-wrap">{value || hints.notProvided}</dd>
            </div>
          );
        })}
      </dl>
    );

  return (
    <SectionShell
      title={hints.otherSurveyTitle}
      open={open}
      onToggle={onToggle}
      editing={false}
      onStartEdit={() => undefined}
      onCancelEdit={() => undefined}
      onSave={() => undefined}
      saving={false}
      canEdit={false}
      hints={hints}
      previewText={previewText}
      readMode={readMode}
      editMode={null}
    />
  );
}

function formatAnswer(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
  if (Array.isArray(raw)) return raw.map((v) => formatAnswer(v)).filter(Boolean).join(', ');
  try {
    return JSON.stringify(raw);
  } catch {
    return '';
  }
}
