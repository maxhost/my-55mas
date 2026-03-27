import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { listRegistrationForms } from '@/features/registration/actions/list-registration-forms';
import { PageHeader } from '@/shared/components/page-header';
import { RegistrationFormsList } from './registration-forms-list';

type Props = { params: { locale: string } };

export default async function TalentRegistrationPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminRegistration');
  const forms = await listRegistrationForms();

  return (
    <div className="p-8">
      <PageHeader title={t('title')} />
      <RegistrationFormsList forms={forms} />
    </div>
  );
}
