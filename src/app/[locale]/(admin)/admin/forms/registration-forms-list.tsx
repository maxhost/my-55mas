'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Link } from '@/lib/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { deleteRegistrationForm } from '@/features/general-forms';
import { Plus, Trash2 } from 'lucide-react';
import type { RegistrationFormListItem } from '@/features/general-forms/types';

type Props = {
  forms: RegistrationFormListItem[];
};

export function RegistrationFormsList({ forms }: Props) {
  const t = useTranslations('AdminForms');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<RegistrationFormListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteRegistrationForm(deleteTarget.id);
      if (result && 'error' in result) {
        const errObj = result.error as Record<string, string[] | undefined>;
        const msg = Object.values(errObj).flat().filter(Boolean)[0];
        setDeleteError(msg ?? t('deleteError'));
        return;
      }
      setDeleteTarget(null);
      toast.success(tc('deletedSuccess'));
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">{t('description')}</p>

      <Link href="/admin/forms/new">
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
              <th className="py-2 font-medium">{t('role')}</th>
              <th className="py-2 font-medium">{t('variants')}</th>
              <th className="py-2 font-medium">{t('created')}</th>
              <th className="py-2 font-medium">{t('updated')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {forms.map((form) => (
              <tr key={form.id} className="border-border border-b">
                <td className="py-2">
                  <Link
                    href={`/admin/forms/${form.id}`}
                    className="text-primary hover:underline"
                  >
                    {form.name}
                  </Link>
                </td>
                <td className="py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    form.target_role === 'talent'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {form.target_role === 'talent' ? t('targetRoleTalent') : t('targetRoleClient')}
                  </span>
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
                <td className="py-2">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(form);
                    }}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        title={t('deleteFormTitle')}
        description={t('deleteFormDescription', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('deleteConfirm')}
        cancelLabel={tc('cancel')}
        onConfirm={handleConfirmDelete}
        variant="destructive"
        isPending={isPending}
        error={deleteError}
      />
    </div>
  );
}
