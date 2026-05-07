'use client';

import { useCallback, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { removeOrderTalent } from '@/features/orders/detail/actions/remove-order-talent';
import type {
  AssignedTalent,
  SpecialistsTabHints,
} from '@/features/orders/detail/types';
import { SearchTalentModal } from './search-talent-modal';

type Props = {
  orderId: string;
  initialAssigned: AssignedTalent[];
  talentsNeeded: number;
  hints: SpecialistsTabHints;
};

function formatRating(
  rating_avg: number | null,
  rating_count: number,
  reviewsTemplate: string,
): string {
  if (!rating_count || rating_avg == null) return '★ —';
  const avg = rating_avg.toFixed(1);
  const reviews = reviewsTemplate.replace('[count]', String(rating_count));
  return `★ ${avg} ${reviews}`;
}

export function SpecialistsTab({
  orderId,
  initialAssigned,
  talentsNeeded,
  hints,
}: Props) {
  const [assigned, setAssigned] = useState<AssignedTalent[]>(initialAssigned);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleRemove = (talentId: string) => {
    setPendingRemoveId(talentId);
    const previous = assigned;
    setAssigned((prev) => prev.filter((t) => t.id !== talentId));
    startTransition(async () => {
      const res = await removeOrderTalent({ orderId, talentId });
      if ('error' in res) {
        setAssigned(previous);
        toast.error(res.error.message || hints.removeError);
        setPendingRemoveId(null);
        return;
      }
      toast.success(hints.removeSuccess);
      setPendingRemoveId(null);
    });
  };

  const handleAdded = useCallback((talent: AssignedTalent) => {
    setAssigned((prev) => {
      if (prev.some((t) => t.id === talent.id)) return prev;
      return [...prev, talent];
    });
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {`Talents asignados: ${assigned.length}/${talentsNeeded}`}
        </span>
        <Button variant="default" onClick={() => setModalOpen(true)}>
          {hints.addTalentButton}
        </Button>
      </div>

      {assigned.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {hints.empty}
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
              {assigned.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">
                    {t.full_name ?? '—'}
                  </TableCell>
                  <TableCell>{t.email ?? '—'}</TableCell>
                  <TableCell>{t.phone ?? '—'}</TableCell>
                  <TableCell>
                    {formatRating(t.rating_avg, t.rating_count, hints.reviewsCount)}
                  </TableCell>
                  <TableCell>{t.completed_count}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(t.id)}
                      disabled={pendingRemoveId === t.id}
                    >
                      {hints.unselectButton}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <SearchTalentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        orderId={orderId}
        currentAssignedCount={assigned.length}
        talentsNeeded={talentsNeeded}
        onTalentAdded={handleAdded}
        hints={hints}
      />
    </div>
  );
}
