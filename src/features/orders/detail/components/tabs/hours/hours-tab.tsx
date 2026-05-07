'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { saveOrderHours } from '@/features/orders/detail/actions/save-order-hours';
import type {
  HoursLogEntry,
  HoursTabData,
  HoursTabHints,
} from '@/features/orders/detail/types';
import { HoursRow } from './hours-row';

type Props = {
  orderId: string;
  data: HoursTabData;
  hints: HoursTabHints;
  locale: string;
  readOnly?: boolean;
};

function newOtherId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random()}`;
}

function buildReportedSummary(template: string, log: HoursLogEntry): string {
  const name = log.reported_by_name ?? '';
  const qty = String(log.reported_qty ?? 0);
  return template.replace('[name]', name).replace('[count]', qty);
}

function emptyOtherLog(): HoursLogEntry {
  return {
    id: newOtherId(),
    kind: 'other',
    description: '',
    unit_price: 0,
    reported_qty: 0,
    confirmed_qty: null,
    reported_by_name: null,
    confirmed_by_name: null,
  };
}

export function HoursTab({
  orderId,
  data,
  hints,
  locale: _locale,
  readOnly = false,
}: Props) {
  const [totalHoursLog, setTotalHoursLog] = useState<HoursLogEntry>(
    data.totalHoursLog,
  );
  const [totalKilometersLog, setTotalKilometersLog] = useState<HoursLogEntry>(
    data.totalKilometersLog,
  );
  const [otherLogs, setOtherLogs] = useState<HoursLogEntry[]>(data.otherLogs);
  const [isSaving, startTransition] = useTransition();

  const updateOther = (id: string, next: HoursLogEntry) => {
    setOtherLogs((prev) => prev.map((entry) => (entry.id === id ? next : entry)));
  };

  const removeOther = (id: string) => {
    setOtherLogs((prev) => prev.filter((entry) => entry.id !== id));
  };

  const addOther = () => {
    setOtherLogs((prev) => [...prev, emptyOtherLog()]);
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveOrderHours({
        orderId,
        totalHoursLog,
        totalKilometersLog,
        otherLogs,
      });
      if ('error' in res) {
        toast.error(res.error.message || hints.saveError);
        return;
      }
      toast.success(hints.saveSuccess);
    });
  };

  const totalHoursLabel = (
    <div className="flex flex-col">
      <span className="font-medium">{hints.totalHoursLabel}</span>
      <span className="text-xs text-muted-foreground">
        {hints.totalHoursClientLabel.replace('[count]', String(data.hoursClient))}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <HoursRow
        label={totalHoursLabel}
        unitPriceLabel={hints.unitPriceLabel}
        confirmedLabel={hints.confirmedQtyLabel}
        log={totalHoursLog}
        onChange={setTotalHoursLog}
        reportedSummary={buildReportedSummary(hints.reportedQtyLabel, totalHoursLog)}
        readOnly={readOnly}
      />

      <Separator />

      <HoursRow
        label={<span className="font-medium">{hints.totalKilometersLabel}</span>}
        unitPriceLabel={hints.pricePerKmLabel}
        confirmedLabel={hints.confirmedKmLabel}
        log={totalKilometersLog}
        onChange={setTotalKilometersLog}
        reportedSummary={buildReportedSummary(
          hints.reportedQtyLabel,
          totalKilometersLog,
        )}
        readOnly={readOnly}
      />

      <Separator />

      {otherLogs.map((entry) => (
        <HoursRow
          key={entry.id}
          label={<span className="font-medium">{hints.otherLabel}</span>}
          unitPriceLabel={hints.pricePerOtherLabel}
          confirmedLabel={hints.confirmedOtherLabel}
          log={entry}
          showDescription
          descriptionLabel={hints.otherLabel}
          onChange={(next) => updateOther(entry.id, next)}
          onRemove={() => removeOther(entry.id)}
          removeLabel={hints.removeOtherButton}
          reportedSummary={buildReportedSummary(hints.reportedQtyLabel, entry)}
          readOnly={readOnly}
        />
      ))}

      {!readOnly && (
        <div>
          <Button type="button" variant="outline" size="sm" onClick={addOther}>
            {hints.addOtherButton}
          </Button>
        </div>
      )}

      {!readOnly && (
        <div className="flex justify-end">
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {hints.saveLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
