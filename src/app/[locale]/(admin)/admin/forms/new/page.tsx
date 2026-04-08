import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { CreateRegistrationForm } from '@/features/general-forms/components/create-registration-form';
import { PageHeader } from '@/shared/components/page-header';

type Props = { params: { locale: string } };

export default async function NewRegistrationFormPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminForms');

  return (
    <div className="p-8">
      <PageHeader title={t('createForm')} backHref="/admin/forms" />
      <CreateRegistrationForm />
    </div>
  );
}
