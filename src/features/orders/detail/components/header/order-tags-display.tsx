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
import { updateOrderTags } from '@/features/orders/detail/actions/update-order-tags';
import type {
  HeaderHints,
  OrderTagOption,
} from '@/features/orders/detail/types';

type Props = {
  orderId: string;
  assignedTags: OrderTagOption[];
  availableTags: OrderTagOption[];
  hints: HeaderHints;
  onTagsChanged: () => void;
};

export function OrderTagsDisplay({
  orderId,
  assignedTags,
  availableTags,
  hints,
  onTagsChanged,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(assignedTags.map((t) => t.id)),
  );
  const [, startTransition] = useTransition();

  // Re-sync local set when parent re-fetches and assignedTags change.
  useEffect(() => {
    setSelected(new Set(assignedTags.map((t) => t.id)));
  }, [assignedTags]);

  const toggle = (id: string, checked: boolean) => {
    const previous = selected;
    const next = new Set(previous);
    if (checked) next.add(id);
    else next.delete(id);
    setSelected(next);
    startTransition(async () => {
      const result = await updateOrderTags({
        orderId,
        tagIds: Array.from(next),
      });
      if ('error' in result) {
        toast.error(result.error.message || hints.tagsUpdateError);
        // Roll back optimistic toggle.
        setSelected(previous);
        return;
      }
      toast.success(hints.tagsUpdateSuccess);
      onTagsChanged();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-muted-foreground text-xs font-medium">
        {hints.fieldTags}:
      </span>
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
                  onCheckedChange={(checked) =>
                    toggle(tag.id, checked === true)
                  }
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
