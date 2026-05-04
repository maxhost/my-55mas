'use client';

import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AssignedSubtypeGroup } from '@/shared/lib/questions/types';

type Props = {
  groupSlug: string | undefined;
  excludedIds: string[];
  assignedGroups: AssignedSubtypeGroup[];
  locale: string;
  onGroupChange: (slug: string) => void;
  onExcludedChange: (ids: string[]) => void;
};

export function SubtypeSourceEditor({
  groupSlug,
  excludedIds,
  assignedGroups,
  locale,
  onGroupChange,
  onExcludedChange,
}: Props) {
  const t = useTranslations('AdminServiceQuestions');

  if (assignedGroups.length === 0) {
    return (
      <p className="text-destructive rounded-md border border-dashed p-2 text-xs">
        {t('noGroupsAssigned')}
      </p>
    );
  }

  const group = assignedGroups.find((g) => g.slug === groupSlug);

  const toggleExcluded = (id: string, excluded: boolean) => {
    onExcludedChange(excluded ? [...excludedIds, id] : excludedIds.filter((x) => x !== id));
  };

  return (
    <div className="space-y-2">
      <Select value={groupSlug ?? ''} onValueChange={(v) => onGroupChange(v ?? '')}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder={t('chooseGroup')}>
            {(v: string) => {
              const g = assignedGroups.find((x) => x.slug === v);
              return g?.translations[locale] ?? g?.slug ?? t('chooseGroup');
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {assignedGroups.map((g) => (
            <SelectItem key={g.id} value={g.slug}>
              {g.translations[locale] ?? g.slug}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {group && (
        <div className="space-y-1 rounded-md border p-2">
          <p className="text-muted-foreground text-xs">{t('subtypeIncludeHint')}</p>
          {group.items.length === 0 && (
            <p className="text-muted-foreground text-xs italic">{t('noItemsInGroup')}</p>
          )}
          {group.items.map((item) => {
            const included = !excludedIds.includes(item.id);
            return (
              <label key={item.id} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={included}
                  onChange={(e) => toggleExcluded(item.id, !e.target.checked)}
                  className="h-3 w-3"
                />
                {item.translations[locale] ?? item.slug}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
