'use client';

import { ChevronRight } from 'lucide-react';
import type { KeyboardEvent } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TalentSearchResult, TalentSearchRowHints } from '@/features/orders/detail/types';
import { cn } from '@/lib/utils';

type Props = {
  talent: TalentSearchResult;
  expanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  selecting: boolean;
  hints: TalentSearchRowHints;
};

export function TalentSearchRow({
  talent,
  expanded,
  onToggle,
  onSelect,
  selecting,
  hints,
}: Props) {
  const ratingText =
    talent.rating_avg !== null && talent.rating_count > 0
      ? `★ ${talent.rating_avg.toFixed(1)} ${hints.reviewsCount.replace(
          '[count]',
          String(talent.rating_count),
        )}`
      : '★ —';

  const servicesText = hints.servicesCount.replace(
    '[count]',
    String(talent.registered_services_count),
  );

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  }

  return (
    <div className="rounded-md border">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={expanded ? hints.collapseLabel : hints.expandLabel}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        className="flex w-full cursor-pointer items-center gap-3 p-3 text-left"
      >
        <ChevronRight
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-90',
          )}
          aria-hidden
        />
        <span className="font-medium">{talent.full_name ?? '—'}</span>
        {talent.is_qualified && (
          <Badge variant="secondary" className="text-[10px]">
            {hints.qualifiedBadge}
          </Badge>
        )}
        <span className="text-sm text-muted-foreground">{ratingText}</span>
        <span className="text-sm text-muted-foreground">{servicesText}</span>
        <div className="ml-auto">
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={selecting}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            {hints.selectButton}
          </Button>
        </div>
      </div>
      {expanded && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t p-3 text-sm">
          <dt className="text-muted-foreground">{hints.detailCountryLabel}</dt>
          <dd>{talent.country_name ?? hints.notProvided}</dd>
          <dt className="text-muted-foreground">{hints.detailCityLabel}</dt>
          <dd>{talent.city_name ?? hints.notProvided}</dd>
          <dt className="text-muted-foreground">{hints.detailPostalCodeLabel}</dt>
          <dd>{talent.postal_code ?? hints.notProvided}</dd>
          <dt className="text-muted-foreground">{hints.detailRegisteredServicesLabel}</dt>
          <dd>{String(talent.registered_services_count)}</dd>
        </dl>
      )}
    </div>
  );
}
