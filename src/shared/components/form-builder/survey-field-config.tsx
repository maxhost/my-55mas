'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';

export type SurveyQuestionOption = {
  key: string;
  label: string;
};

type Props = {
  surveyQuestions: SurveyQuestionOption[];
  selectedQuestion?: string;
  onQuestionChange: (key: string) => void;
};

export function SurveyFieldConfig({ surveyQuestions, selectedQuestion, onQuestionChange }: Props) {
  const t = useTranslations('AdminFormBuilder');

  if (surveyQuestions.length === 0) {
    return (
      <div className="bg-muted/50 ml-6 rounded-md p-3">
        <p className="text-muted-foreground text-xs">{t('surveyFieldInfo')}</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/50 ml-6 space-y-1 rounded-md p-3">
      <Label className="text-xs">{t('surveyQuestion')}</Label>
      <select
        value={selectedQuestion ?? ''}
        onChange={(e) => onQuestionChange(e.target.value)}
        className="border-input bg-background h-7 w-64 rounded-md border px-2 text-xs"
      >
        <option value="">{t('selectQuestion')}</option>
        {surveyQuestions.map((q) => (
          <option key={q.key} value={q.key}>
            {q.label || q.key}
          </option>
        ))}
      </select>
    </div>
  );
}
