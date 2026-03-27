'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Link } from '@/lib/i18n/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { createRegistrationForm } from '@/features/registration/actions/create-registration-form';
import type { RegistrationFormListItem } from '@/features/registration/types';

type Props = {
  forms: RegistrationFormListItem[];
};

export function RegistrationFormsList({ forms }: Props) {
  const t = useTranslations('AdminRegistration');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await createRegistrationForm(name.trim());
      if ('error' in result) {
        const errors = result.error as Record<string, string[]>;
        const firstMsg = Object.values(errors).flat()[0];
        toast.error(firstMsg ?? tc('saveError'));
        return;
      }
      toast.success(tc('savedSuccess'));
      setName('');
      router.push(`/admin/talent-registration/${result.id}`);
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">{t('description')}</p>

      {/* Create form */}
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('namePlaceholder')}
          disabled={isPending}
          className="h-9 w-64"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreate}
          disabled={!name.trim() || isPending}
        >
          <Plus className="mr-1 h-3 w-3" />
          {t('createForm')}
        </Button>
      </div>

      {/* Forms table */}
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
