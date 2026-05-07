import type { HighlightsHints, TalentHighlightsStats } from '@/features/talents/detail/types';

type Props = {
  stats: TalentHighlightsStats;
  hints: HighlightsHints;
};

function formatReviewsCount(template: string, count: number): string {
  // The i18n string uses `[count]` (not `{count}`) as placeholder so that
  // next-intl / ICU MessageFormat does not parse it as an unfilled variable
  // and fail to render. We substitute manually here.
  return template.replace('[count]', String(count));
}

export function HighlightsRow({ stats, hints }: Props) {
  const { totalOrders, ratingAvg, ratingCount, ageMonths, lastActivityDays } = stats;

  const ordersText = `${hints.ordersLabel} ${totalOrders}`;

  const ratingText =
    ratingAvg === null
      ? `★ ${hints.none} ${formatReviewsCount(hints.reviewsCount, 0)}`
      : `★ ${ratingAvg.toFixed(1)} ${formatReviewsCount(hints.reviewsCount, ratingCount)}`;

  const ageText =
    ageMonths === 0
      ? `${hints.ageLabel} ${hints.none}`
      : `${hints.ageLabel} ${ageMonths}${hints.monthsShort}`;

  const lastActivityText =
    lastActivityDays === null
      ? `${hints.lastActivityLabel} ${hints.none}`
      : `${hints.lastActivityLabel} ${lastActivityDays}${hints.daysShort}`;

  const items = [ordersText, ratingText, ageText, lastActivityText];

  return (
    <div className="flex items-center gap-3 text-sm">
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-3">
          <span className="font-medium text-foreground">{item}</span>
          {idx < items.length - 1 ? (
            <span aria-hidden="true" className="text-muted-foreground">
              |
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}
