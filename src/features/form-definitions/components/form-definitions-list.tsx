'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Pencil } from 'lucide-react';
import type { FormDefinition } from '../types';

type Props = {
  formDefinitions: FormDefinition[];
  locale: string;
};

export function FormDefinitionsList({ formDefinitions, locale }: Props) {
  const t = useTranslations('AdminFormDefinitions');

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="text-left">
            <th className="p-3 font-medium">{t('formKeyColumn')}</th>
            <th className="p-3 font-medium">{t('statusColumn')}</th>
            <th className="p-3 font-medium">{t('localesColumn')}</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {formDefinitions.map((form) => {
            const localesPresent = Object.keys(form.i18n ?? {}).filter(
              (l) => Object.keys(form.i18n[l] ?? {}).length > 0
            );

            return (
              <tr key={form.id} className="border-t">
                <td className="p-3 font-mono text-xs">{form.form_key}</td>
                <td className="p-3">
                  <span
                    className={
                      form.is_active
                        ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800'
                        : 'rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600'
                    }
                  >
                    {form.is_active ? t('statusActive') : t('statusInactive')}
                  </span>
                </td>
                <td className="p-3 text-xs">
                  {localesPresent.length === 0 ? (
                    <span className="text-muted-foreground italic">{t('noLocales')}</span>
                  ) : (
                    localesPresent.map((l) => l.toUpperCase()).join(', ')
                  )}
                </td>
                <td className="p-3 text-right">
                  <Link
                    href={`/${locale}/admin/form-definitions/${form.id}`}
                    className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                  >
                    <Pencil className="h-3 w-3" />
                    {t('edit')}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
