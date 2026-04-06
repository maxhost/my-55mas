'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { deleteService } from '../actions/delete-service';
import type { ServiceListItem } from '../types';
import { ServicesToolbar } from './services-toolbar';
import { ServicesTable } from './services-table';
import { CreateServiceSheet } from './create-service-form';

type Props = {
  services: ServiceListItem[];
};

export function ServicesList({ services }: Props) {
  const t = useTranslations('AdminServices');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ServiceListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (!search.trim()) return services;
    const q = search.toLowerCase();
    return services.filter((s) => s.name.toLowerCase().includes(q));
  }, [services, search]);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteService(deleteTarget.id);
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
      <div className="flex items-center justify-between gap-4">
        <ServicesToolbar search={search} onSearchChange={setSearch} />
        <CreateServiceSheet />
      </div>
      <ServicesTable
        services={filtered}
        onDelete={(id) => {
          const svc = services.find((s) => s.id === id);
          if (svc) setDeleteTarget(svc);
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        title={t('deleteServiceTitle')}
        description={t('deleteServiceDescription', { name: deleteTarget?.name ?? '' })}
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
