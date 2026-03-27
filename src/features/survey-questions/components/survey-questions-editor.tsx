'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { locales } from '@/lib/i18n/config';
import { saveSurveyQuestions } from '../actions/save-survey-questions';
import type { SurveyQuestionWithTranslations, SurveyQuestionInput } from '../types';
import { SurveyQuestionCard } from './survey-question-card';

type Props = {
  initialQuestions: SurveyQuestionWithTranslations[];
};

function toInput(q: SurveyQuestionWithTranslations): SurveyQuestionInput {
  return {
    id: q.id,
    key: q.key,
    response_type: q.response_type,
    options: q.options ? [...q.options] : null,
    sort_order: q.sort_order,
    is_active: q.is_active,
    translations: Object.fromEntries(
      Object.entries(q.translations).map(([locale, t]) => [locale, { ...t }])
    ),
  };
}

export function SurveyQuestionsEditor({ initialQuestions }: Props) {
  const t = useTranslations('AdminSurveyQuestions');
  const tc = useTranslations('Common');
  const [isPending, startTransition] = useTransition();
  const [questions, setQuestions] = useState<SurveyQuestionInput[]>(
    initialQuestions.map(toInput)
  );

  const primaryLocale = locales[0];

  const addQuestion = () => {
    const idx = questions.length + 1;
    setQuestions([
      ...questions,
      {
        key: `question_${idx}`,
        response_type: 'text',
        options: null,
        sort_order: questions.length,
        is_active: true,
        translations: {},
      },
    ]);
  };

  const updateQuestion = (index: number, question: SurveyQuestionInput) => {
    setQuestions(questions.map((q, i) => (i === index ? question : q)));
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const normalized = questions.map((q, i) => ({ ...q, sort_order: i }));

    startTransition(async () => {
      const result = await saveSurveyQuestions({ questions: normalized });

      if (result && 'error' in result) {
        const errors = result.error as Record<string, string[] | undefined>;
        const firstMsg = Object.values(errors).flat().filter(Boolean)[0];
        toast.error(firstMsg ?? tc('saveError'));
        return;
      }

      toast.success(tc('savedSuccess'));
      setQuestions(normalized);
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{t('description')}</p>

      <Tabs defaultValue={primaryLocale}>
        <TabsList>
          {locales.map((locale) => (
            <TabsTrigger key={locale} value={locale}>
              {locale.toUpperCase()}
            </TabsTrigger>
          ))}
        </TabsList>

        {locales.map((locale) => (
          <TabsContent key={locale} value={locale} className="space-y-3 pt-3">
            {questions.length === 0 && (
              <p className="text-muted-foreground py-4">{t('noQuestions')}</p>
            )}

            {questions.map((question, index) => (
              <SurveyQuestionCard
                key={question.id ?? `new-${index}`}
                question={question}
                locale={locale}
                isPrimary={locale === primaryLocale}
                onChange={(q) => updateQuestion(index, q)}
                onRemove={() => removeQuestion(index)}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={addQuestion}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addQuestion')}
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? t('saving') : t('save')}
        </Button>
      </div>
    </div>
  );
}
