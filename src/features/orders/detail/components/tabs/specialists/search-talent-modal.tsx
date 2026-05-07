'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { addOrderTalent } from '@/features/orders/detail/actions/add-order-talent';
import { getTalentSearchResults } from '@/features/orders/detail/actions/get-talent-search-results';
import type { TalentSearchContext } from '@/features/orders/detail/actions/get-talent-search-context';
import type {
  AssignedTalent,
  SpecialistsTabHints,
  TalentSearchFilters as Filters,
  TalentSearchResult,
} from '@/features/orders/detail/types';
import { TalentSearchFilters } from './talent-search-filters';
import { TalentSearchRow } from './talent-search-row';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  locale: string;
  context: TalentSearchContext;
  currentAssignedCount: number;
  talentsNeeded: number;
  onTalentAdded: (talent: AssignedTalent) => void;
  hints: SpecialistsTabHints;
};

const EMPTY_FILTERS: Filters = {
  countryId: null,
  cityId: null,
  postalCode: '',
  serviceId: null,
  query: '',
};

function toAssigned(r: TalentSearchResult): AssignedTalent {
  return {
    id: r.id,
    user_id: r.user_id,
    full_name: r.full_name,
    email: r.email,
    phone: r.phone,
    rating_avg: r.rating_avg,
    rating_count: r.rating_count,
    completed_count: r.completed_count,
    is_primary: false,
  };
}

export function SearchTalentModal({
  open,
  onOpenChange,
  orderId,
  locale,
  context,
  currentAssignedCount,
  talentsNeeded,
  onTalentAdded,
  hints,
}: Props) {
  const [filters, setFilters] = useState<Filters>(context.defaultFilters);
  const [results, setResults] = useState<TalentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTalentId, setExpandedTalentId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset filters to the order defaults whenever the modal opens.
  useEffect(() => {
    if (open) {
      setFilters(context.defaultFilters);
      setExpandedTalentId(null);
    }
  }, [open, context.defaultFilters]);

  // Fetch results whenever filters change (debounced).
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      getTalentSearchResults(orderId, filters, locale)
        .then((rows) => {
          setResults(rows);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters, open, orderId, locale]);

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

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
  };

  const handleToggleExpand = (talentId: string) => {
    setExpandedTalentId((prev) => (prev === talentId ? null : talentId));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{hints.modalTitle}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <TalentSearchFilters
            values={filters}
            onChange={setFilters}
            onClear={handleClearFilters}
            countries={context.countries}
            cities={context.cities}
            services={context.services}
            hints={hints.filters}
          />

          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{hints.loading}</span>
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              {hints.modalEmpty}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {results.map((r) => (
                <TalentSearchRow
                  key={r.id}
                  talent={r}
                  expanded={expandedTalentId === r.id}
                  onToggle={() => handleToggleExpand(r.id)}
                  onSelect={() => handleSelect(r)}
                  selecting={pendingId === r.id}
                  hints={hints.row}
                />
              ))}
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
