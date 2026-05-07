'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { HoursLogEntry } from '@/features/orders/detail/types';

type Props = {
  label: ReactNode;
  unitPriceLabel: string;
  confirmedLabel: string;
  log: HoursLogEntry;
  showDescription?: boolean;
  descriptionLabel?: string;
  onChange: (next: HoursLogEntry) => void;
  onRemove?: () => void;
  removeLabel?: string;
  reportedSummary: string;
};

function parseNumber(raw: string): number {
  if (raw === '') return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function parseNullableNumber(raw: string): number | null {
  if (raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function HoursRow({
  label,
  unitPriceLabel,
  confirmedLabel,
  log,
  showDescription,
  descriptionLabel,
  onChange,
  onRemove,
  removeLabel,
  reportedSummary,
}: Props) {
  const firstColumn = showDescription ? (
    <Input
      type="text"
      placeholder={descriptionLabel}
      value={log.description ?? ''}
      onChange={(event) =>
        onChange({ ...log, description: event.target.value || null })
      }
    />
  ) : (
    label
  );

  return (
    <div className="flex items-center gap-3">
      <div className="grid flex-1 grid-cols-1 items-center gap-3 md:grid-cols-4">
        <div className="min-w-0 text-sm">{firstColumn}</div>

        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            €
          </span>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder={unitPriceLabel}
            value={Number.isFinite(log.unit_price) ? String(log.unit_price) : ''}
            onChange={(event) =>
              onChange({ ...log, unit_price: parseNumber(event.target.value) })
            }
            className="pl-6"
          />
        </div>

        <div className="text-sm text-muted-foreground">{reportedSummary}</div>

        <div>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder={confirmedLabel}
            value={log.confirmed_qty == null ? '' : String(log.confirmed_qty)}
            onChange={(event) =>
              onChange({
                ...log,
                confirmed_qty: parseNullableNumber(event.target.value),
              })
            }
          />
        </div>
      </div>

      {onRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label={removeLabel}
          title={removeLabel}
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}
