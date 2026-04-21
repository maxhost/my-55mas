'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Link } from '@/lib/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { Plus, Trash2 } from 'lucide-react';
import { createTalentService } from '@/features/talent-services/actions/create-talent-service';
import { deleteTalentForm } from '@/features/talent-services/actions/delete-talent-form';
import type { TalentServiceListItem } from '@/features/talent-services/actions/list-talent-services';

type Props = {
  forms: TalentServiceListItem[];
  availableServices: { id: string; name: string }[];
};

export function TalentServicesList({ forms, availableServices }: Props) {
  const t = useTranslations('AdminTalentServices');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [selectedService, setSelectedService] = useState('');
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<TalentServiceListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleCreate = () => {
    if (!selectedService) return;
    startTransition(async () => {
      const result = await createTalentService(selectedService);
      if ('error' in result) {
        const errors = result.error as Record<string, string[]>;
        const firstMsg = Object.values(errors).flat()[0];
        toast.error(firstMsg ?? tc('saveError'));
        return;
      }
      toast.success(tc('savedSuccess'));
      router.push(`/admin/talent-services/${result.id}`);
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteTalentForm(deleteTarget.service_id);
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
      {/* Create form section */}
      {availableServices.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            disabled={isPending}
            className="border-border bg-background h-9 rounded-md border px-3 text-sm"
          >
            <option value="">{t('selectService')}</option>
            {availableServices.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreate}
            disabled={!selectedService || isPending}
          >
            <Plus className="mr-1 h-3 w-3" />
            {t('createForm')}
          </Button>
        </div>
      )}

      {/* Forms table */}
      {forms.length === 0 ? (
        <p className="text-muted-foreground py-4">{t('noForms')}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border border-b text-left">
              <th className="py-2 font-medium">{t('service')}</th>
              <th className="py-2 font-medium">{t('variants')}</th>
              <th className="py-2 font-medium">{t('updated')}</th>
              <th className="w-10 py-2" />
            </tr>
          </thead>
          <tbody>
            {forms.map((form) => (
              <tr key={form.id} className="border-border border-b">
                <td className="py-2">
                  <Link
                    href={`/admin/talent-services/${form.id}`}
                    className="text-primary hover:underline"
                  >
                    {form.service_name}
                  </Link>
                </td>
                <td className="py-2">
                  {form.variant_count > 0
                    ? t('variantCount', { count: form.variant_count })
                    : t('generalOnly')}
                </td>
                <td className="text-muted-foreground py-2">
                  {form.updated_at
                    ? new Date(form.updated_at).toLocaleDateString()
                    : '—'}
                </td>
                <td className="py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(form)}
                  >
                    <Trash2 className="size-3.5" />
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
        description={t('deleteFormDescription', { name: deleteTarget?.service_name ?? '' })}
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
