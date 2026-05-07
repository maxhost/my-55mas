import type { ClientStats, HighlightsHints } from '@/features/clients/detail/types';

type Props = {
  stats: ClientStats;
  hints: HighlightsHints;
};

function formatPendingSuffix(template: string, count: number): string {
  // The i18n string uses `[count]` (not `{count}`) as placeholder so that
  // next-intl / ICU MessageFormat does not parse it as an unfilled variable
  // and fail to render. We substitute manually here.
  return template.replace('[count]', String(count));
}

function formatAmount(amount: number, currency: string): string {
  const formatted = new Intl.NumberFormat('es', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
  }).format(amount);
  // currencyDisplay: 'code' yields e.g. "1.234,56 EUR" — matches spec "X EUR".
  return formatted;
}

export function HighlightsRow({ stats, hints }: Props) {
  const { totalOrders, totalPaid, balanceOwed, pendingOrders, currency } = stats;

  const ordersText =
    totalOrders === 0
      ? `${hints.ordersLabel} ${hints.none}`
      : `${hints.ordersLabel} ${totalOrders}`;

  const totalPaidText =
    totalPaid === 0
      ? `${hints.totalPaidLabel} ${hints.none}`
      : `${hints.totalPaidLabel} ${formatAmount(totalPaid, currency)}`;

  const balanceOwedText =
    balanceOwed === 0
      ? `${hints.balanceOwedLabel} ${hints.none}`
      : `${hints.balanceOwedLabel} ${formatAmount(balanceOwed, currency)} ${formatPendingSuffix(hints.pendingOrdersSuffix, pendingOrders)}`;

  const items = [ordersText, totalPaidText, balanceOwedText];

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
