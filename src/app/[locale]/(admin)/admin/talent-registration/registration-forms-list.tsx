'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { RegistrationFormListItem } from '@/features/registration/types';

type Props = {
  forms: RegistrationFormListItem[];
};

export function RegistrationFormsList({ forms }: Props) {
  const t = useTranslations('AdminRegistration');

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">{t('description')}</p>

      <Link href="/admin/talent-registration/new">
        <Button variant="outline" size="sm">
          <Plus className="mr-1 h-3 w-3" />
          {t('createForm')}
        </Button>
      </Link>

      {forms.length === 0 ? (
        <p className="text-muted-foreground py-4">{t('noForms')}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border border-b text-left">
              <th className="py-2 font-medium">{t('formName')}</th>
              <th className="py-2 font-medium">{t('variants')}</th>
              <th className="py-2 font-medium">{t('created')}</th>
              <th className="py-2 font-medium">{t('updated')}</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((form) => (
              <tr key={form.id} className="border-border border-b">
                <td className="py-2">
                  <Link
                    href={`/admin/talent-registration/${form.id}`}
                    className="text-primary hover:underline"
                  >
                    {form.name}
                  </Link>
                </td>
                <td className="py-2">
                  {form.variant_count > 0
                    ? t('variantCount', { count: form.variant_count })
                    : t('generalOnly')}
                </td>
                <td className="text-muted-foreground py-2">
                  {form.created_at
                    ? new Date(form.created_at).toLocaleDateString()
                    : '—'}
                </td>
                <td className="text-muted-foreground py-2">
                  {form.updated_at
                    ? new Date(form.updated_at).toLocaleDateString()
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
