'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { addOrderTalent } from '@/features/orders/detail/actions/add-order-talent';
import { getTalentSearchResults } from '@/features/orders/detail/actions/get-talent-search-results';
import type { TalentSearchContext } from '@/features/orders/detail/actions/get-talent-search-context';
import {
  DEFAULT_TALENT_SEARCH_PAGE_SIZE,
  type AssignedTalent,
  type SpecialistsTabHints,
  type TalentSearchFilters as Filters,
  type TalentSearchResult,
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

const PAGE_SIZE = DEFAULT_TALENT_SEARCH_PAGE_SIZE;

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
  const [page, setPage] = useState(0);
  const [results, setResults] = useState<TalentSearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedTalentId, setExpandedTalentId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOpenRef = useRef(false);

  // Reset filters / page / clear stale results / show loader ONLY when the
  // modal transitions from closed to open. Without the ref guard, parent
  // re-renders that change the `context` object identity would re-fire this
  // effect and wipe the user's in-flight filter state.
  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (justOpened) {
      setFilters(context.defaultFilters);
      setPage(0);
      setExpandedTalentId(null);
      setResults([]);
      setTotalCount(0);
      setLoading(true);
    }
  }, [open, context.defaultFilters]);

  // Fetch results whenever filters / page / open change (debounced).
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      getTalentSearchResults(orderId, filters, { page, pageSize: PAGE_SIZE }, locale)
        .then((res) => {
          setResults(res.rows);
          setTotalCount(res.totalCount);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters, page, open, orderId, locale]);

  const handleFiltersChange = (next: Filters) => {
    setFilters(next);
    setPage(0); // any filter change resets to first page
  };

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
    setPage(0);
  };

  const handleToggleExpand = (talentId: string) => {
    setExpandedTalentId((prev) => (prev === talentId ? null : talentId));
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;
  const fromIndex = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const toIndex = Math.min(totalCount, (page + 1) * PAGE_SIZE);
  const pageInfo = hints.pagination.pageInfo
    .replace('[from]', String(fromIndex))
    .replace('[to]', String(toIndex))
    .replace('[total]', String(totalCount));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{hints.modalTitle}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <TalentSearchFilters
            values={filters}
            onChange={handleFiltersChange}
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
            <>
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
              <div className="flex items-center justify-between gap-2 pt-2 text-sm">
                <span className="text-muted-foreground">{pageInfo}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={!hasPrev}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {hints.pagination.prev}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasNext}
                  >
                    {hints.pagination.next}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
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
