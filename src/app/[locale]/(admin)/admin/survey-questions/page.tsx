import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { listSurveyQuestions } from '@/features/survey-questions/actions/list-survey-questions';
import { PageHeader } from '@/shared/components/page-header';
import { SurveyQuestionsEditor } from '@/features/survey-questions/components/survey-questions-editor';

type Props = { params: { locale: string } };

export default async function SurveyQuestionsPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminSurveyQuestions');
  const questions = await listSurveyQuestions();

  return (
    <div className="p-8">
      <PageHeader title={t('title')} />
      <SurveyQuestionsEditor initialQuestions={questions} />
    </div>
  );
}
