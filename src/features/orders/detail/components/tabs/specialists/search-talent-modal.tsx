'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { addOrderTalent } from '@/features/orders/detail/actions/add-order-talent';
import { getTalentSearchResults } from '@/features/orders/detail/actions/get-talent-search-results';
import type { AssignedTalent, SpecialistsTabHints, TalentSearchResult } from '@/features/orders/detail/types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  currentAssignedCount: number;
  talentsNeeded: number;
  onTalentAdded: (talent: AssignedTalent) => void;
  hints: SpecialistsTabHints;
};

function toAssigned(r: TalentSearchResult): AssignedTalent {
  return { ...r, rating_count: 0, is_primary: false };
}

export function SearchTalentModal({
  open,
  onOpenChange,
  orderId,
  currentAssignedCount,
  talentsNeeded,
  onTalentAdded,
  hints,
}: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TalentSearchResult[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void getTalentSearchResults(orderId, query).then(setResults);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, orderId]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  const handleSelect = (talent: TalentSearchResult) => {
    if (currentAssignedCount >= talentsNeeded) {
      toast.error(hints.maxReachedToast.replace('[count]', String(talentsNeeded)));
      return;
    }
    setPendingId(talent.id);
    startTransition(async () => {
      const res = await addOrderTalent({ orderId, talentId: talent.id });
      if ('error' in res) {
        toast.error(res.error.message || hints.selectError);
        setPendingId(null);
        return;
      }
      onTalentAdded(toAssigned(talent));
      toast.success(hints.selectSuccess);
      setPendingId(null);
      onOpenChange(false);
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{hints.modalTitle}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={hints.modalSearchPlaceholder}
          />
          {results.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              {hints.modalEmpty}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{hints.columnName}</TableHead>
                    <TableHead>{hints.columnEmail}</TableHead>
                    <TableHead>{hints.columnPhone}</TableHead>
                    <TableHead>{hints.columnRating}</TableHead>
                    <TableHead>{hints.columnCompleted}</TableHead>
                    <TableHead className="text-right">{hints.columnAction}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{r.full_name ?? '—'}</span>
                          {r.is_qualified ? (
                            <Badge variant="secondary" className="text-[10px]">
                              {hints.qualifiedBadge}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{r.email ?? '—'}</TableCell>
                      <TableCell>{r.phone ?? '—'}</TableCell>
                      <TableCell>
                        {r.rating_avg != null ? `★ ${r.rating_avg.toFixed(1)}` : '★ —'}
                      </TableCell>
                      <TableCell>{r.completed_count}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSelect(r)}
                          disabled={pendingId === r.id}
                        >
                          {hints.selectButton}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {hints.modalCancel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
