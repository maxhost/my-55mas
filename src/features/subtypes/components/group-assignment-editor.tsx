'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { assignGroups } from '../actions/assign-groups';
import type { SubtypeGroupWithTranslations } from '../types';

type Props = {
  serviceId: string;
  assignedGroupIds: string[];
  allGroups: SubtypeGroupWithTranslations[];
  locale: string;
};

export function GroupAssignmentEditor({
  serviceId,
  assignedGroupIds,
  allGroups,
  locale,
}: Props) {
  const t = useTranslations('AdminSubtypes');
  const tc = useTranslations('Common');
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(assignedGroupIds)
  );

  const toggle = (groupId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const handleSave = () => {
    const groupIds = Array.from(selectedIds).map((id, i) => ({
      group_id: id,
      sort_order: i,
    }));

    startTransition(async () => {
      const result = await assignGroups({ service_id: serviceId, group_ids: groupIds });

      if (result && 'error' in result) {
        const errors = result.error as Record<string, string[] | undefined>;
        const firstMsg = Object.values(errors).flat().filter(Boolean)[0];
        toast.error(firstMsg ?? tc('saveError'));
        return;
      }

      toast.success(tc('savedSuccess'));
    });
  };

  if (allGroups.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t('assignTitle')}</h3>
        <p className="text-muted-foreground text-sm">{t('noGroupsAvailable')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{t('assignTitle')}</h3>
      <p className="text-muted-foreground text-sm">{t('assignDescription')}</p>

      <div className="space-y-2">
        {allGroups.map((group) => {
          const name = group.translations[locale] ?? group.slug;
          const itemCount = group.items.length;

          return (
            <label
              key={group.id}
              className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50"
            >
              <Checkbox
                checked={selectedIds.has(group.id)}
                onCheckedChange={() => toggle(group.id)}
              />
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">
                  {group.slug} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? t('saving') : t('saveAssignments')}
      </Button>
    </div>
  );
}
