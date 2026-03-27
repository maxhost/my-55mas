'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Link } from '@/lib/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { createTalentService } from '@/features/talent-services/actions/create-talent-service';
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
