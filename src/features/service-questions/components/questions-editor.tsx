'use client';

import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { saveServiceQuestions } from '../actions/save-questions';
import type {
  AssignedSubtypeGroup,
  Question,
  QuestionTarget,
} from '@/shared/lib/questions/types';
import { QuestionCard } from './question-card';

type Props = {
  serviceId: string;
  /** Which question list to persist: client-facing (services.questions) or talent-facing (services.talent_questions). */
  target: QuestionTarget;
  initialQuestions: Question[];
  assignedGroups: AssignedSubtypeGroup[];
};

function defaultQuestion(index: number): Question {
  return {
    key: `pregunta_${index + 1}`,
    type: 'text',
    required: false,
    i18n: {},
  };
}

export function QuestionsEditor({ serviceId, target, initialQuestions, assignedGroups }: Props) {
  const t = useTranslations('AdminServiceQuestions');
  const tc = useTranslations('Common');
  const locale = useLocale();
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [isPending, startTransition] = useTransition();

  const updateAt = (index: number, q: Question) => {
    setQuestions(questions.map((x, i) => (i === index ? q : x)));
  };
  const removeAt = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };
  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...questions];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setQuestions(next);
  };
  const moveDown = (index: number) => {
    if (index === questions.length - 1) return;
    const next = [...questions];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setQuestions(next);
  };
  const add = () => {
    setQuestions([...questions, defaultQuestion(questions.length)]);
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveServiceQuestions({ serviceId, target, questions });
      if ('error' in result) {
        const msg = Object.values(result.error).flat().filter(Boolean)[0];
        toast.error(msg ?? tc('saveError'));
        return;
      }
      toast.success(tc('savedSuccess'));
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">{t('description')}</p>

      <div className="space-y-2">
        {questions.length === 0 && (
          <p className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm">
            {t('noQuestions')}
          </p>
        )}
        {questions.map((q, i) => (
          <QuestionCard
            key={i}
            question={q}
            index={i}
            total={questions.length}
            assignedGroups={assignedGroups}
            locale={locale}
            onChange={(next) => updateAt(i, next)}
            onRemove={() => removeAt(i)}
            onMoveUp={() => moveUp(i)}
            onMoveDown={() => moveDown(i)}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={add}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addQuestion')}
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? tc('saving') : tc('save')}
        </Button>
      </div>
    </div>
  );
}
