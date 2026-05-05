'use client';

import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { updateTalentTags } from '@/features/talents/detail/actions/update-talent-tags';
import type {
  HeaderHints,
  TalentTagOption,
} from '@/features/talents/detail/types';

type Props = {
  talentId: string;
  assignedTags: TalentTagOption[];
  availableTags: TalentTagOption[];
  hints: HeaderHints;
  onTagsChanged: () => void;
};

export function TalentTagsDisplay({
  talentId,
  assignedTags,
  availableTags,
  hints,
  onTagsChanged,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(assignedTags.map((t) => t.id)),
  );
  const [, startTransition] = useTransition();

  // Re-sync local set when the parent re-fetches and assignedTags change.
  useEffect(() => {
    setSelected(new Set(assignedTags.map((t) => t.id)));
  }, [assignedTags]);

  const toggle = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    setSelected(next);
    startTransition(async () => {
      const result = await updateTalentTags({
        talentId,
        tagIds: Array.from(next),
      });
      if ('error' in result) {
        toast.error(result.error.message);
        // Roll back optimistic toggle.
        setSelected(selected);
        return;
      }
      onTagsChanged();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {assignedTags.length === 0 ? (
        <span className="text-muted-foreground text-xs">{hints.noTags}</span>
      ) : (
        assignedTags.map((tag) => (
          <Badge key={tag.id} variant="outline">
            {tag.name}
          </Badge>
        ))
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="xs">
              <Tag />
              {hints.manageTags}
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-64 p-2">
          <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
            {hints.manageTags}
          </div>
          <DropdownMenuSeparator />
          <div className="max-h-64 overflow-y-auto">
            {availableTags.length === 0 ? (
              <div className="text-muted-foreground px-2 py-1 text-xs">
                {hints.noTags}
              </div>
            ) : (
              availableTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag.id}
                  checked={selected.has(tag.id)}
                  onCheckedChange={(checked) => toggle(tag.id, checked === true)}
                  closeOnClick={false}
                >
                  {tag.name}
                </DropdownMenuCheckboxItem>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
