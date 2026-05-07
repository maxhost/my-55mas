'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  ServiceQuestionsRenderer,
  type AnswersMap,
} from '@/shared/components/question-renderers';
import { resolveQuestionLabels } from '@/shared/lib/questions/resolve-options';
import { saveOrderServiceAnswers } from '../../../actions/save-order-service-answers';
import type {
  ServiceAnswersValues,
  ServiceTabContext,
  ServiceTabHints,
} from '../../../types';
import { Field, SectionShell } from './service-tab';

type Props = {
  orderId: string;
  data: ServiceAnswersValues;
  context: ServiceTabContext;
  hints: ServiceTabHints;
  locale: string;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
};

function formatAnswer(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value || null;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? '✓' : '—';
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return value.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join(', ');
  }
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export function ServiceAnswersSection({
  orderId,
  data,
  hints,
  locale,
  open,
  onToggle,
  onSaved,
  onDirtyChange,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [answers, setAnswers] = useState<AnswersMap>(data.answers);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setAnswers(data.answers);
  }, [data.answers]);

  const dirty = useMemo(
    () => editing && JSON.stringify(answers) !== JSON.stringify(data.answers),
    [editing, answers, data.answers],
  );

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const previewText = data.service_name ?? hints.notProvided;

  const rendererHints = {
    yes: hints.notProvided,
    no: hints.notProvided,
    fileTooLarge: hints.section.saveError,
    fileWrongType: hints.section.saveError,
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveOrderServiceAnswers({ orderId, answers });
      if ('error' in res) {
        toast.error(res.error.message || hints.section.saveError);
        return;
      }
      toast.success(hints.section.saveSuccess);
      setEditing(false);
      onDirtyChange(false);
      onSaved();
    });
  };

  const readMode = (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label={hints.serviceNameLabel}
          value={data.service_name}
          fallback={hints.notProvided}
        />
      </dl>
      {data.questions.length > 0 && (
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 border-t pt-3">
          {data.questions.map((q) => {
            const labels = resolveQuestionLabels(q, locale, 'es');
            return (
              <Field
                key={q.key}
                label={labels.label}
                value={formatAnswer(data.answers[q.key])}
                fallback={hints.notProvided}
              />
            );
          })}
        </dl>
      )}
      {data.questions.length === 0 && (
        <p className="text-xs text-muted-foreground">{hints.empty}</p>
      )}
    </div>
  );

  const editMode = (
    <div className="flex flex-col gap-3">
      <ServiceQuestionsRenderer
        questions={data.questions}
        answers={answers}
        onChange={setAnswers}
        locale={locale}
        assignedGroups={[]}
        hints={rendererHints}
      />
      {data.questions.length === 0 && (
        <p className="text-xs text-muted-foreground">{hints.empty}</p>
      )}
    </div>
  );

  return (
    <SectionShell
      title={hints.serviceAnswersTitle}
      open={open}
      onToggle={onToggle}
      editing={editing}
      onStartEdit={() => {
        setAnswers(data.answers);
        setEditing(true);
      }}
      onCancelEdit={() => {
        setAnswers(data.answers);
        setEditing(false);
        onDirtyChange(false);
      }}
      onSave={handleSave}
      saving={isPending}
      sectionHints={hints.section}
      previewText={previewText}
      readMode={readMode}
      editMode={editMode}
    />
  );
}
