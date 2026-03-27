import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { CreateRegistrationForm } from '@/features/registration/components/create-registration-form';
import { PageHeader } from '@/shared/components/page-header';

type Props = { params: { locale: string } };

export default async function NewRegistrationFormPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminRegistration');

  return (
    <div className="p-8">
      <PageHeader title={t('createForm')} backHref="/admin/talent-registration" />
      <CreateRegistrationForm />
    </div>
  );
}
