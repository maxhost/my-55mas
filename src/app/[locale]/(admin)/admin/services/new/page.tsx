import { redirect } from 'next/navigation';
import { unstable_setRequestLocale } from 'next-intl/server';

type Props = { params: { locale: string } };

export default function NewServicePage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  redirect(`/${locale}/admin/services`);
}
