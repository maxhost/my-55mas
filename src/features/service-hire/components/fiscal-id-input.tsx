'use client';

import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { validateFiscalId } from '@/shared/fiscal/validators';
import type { FiscalIdTypeOption } from '../actions/list-fiscal-id-types';

type Props = {
  idPrefix: string;
  options: FiscalIdTypeOption[];
  typeId: string;
  number: string;
  onTypeChange: (typeId: string) => void;
  onNumberChange: (value: string) => void;
  hints: {
    typeLabel: string;
    typePlaceholder: string;
    numberLabel: string;
    numberPlaceholder: string;
    formatError: string;
  };
};

// Reusable pair (type select + number input). Format error is shown only
// after the user has typed something AND a type is selected — this avoids
// noisy errors on first render. Server actions re-validate, so a stale UI
// state cannot bypass the check.
export function FiscalIdInput({
  idPrefix,
  options,
  typeId,
  number,
  onTypeChange,
  onNumberChange,
  hints,
}: Props) {
  const selected = options.find((o) => o.id === typeId);
  const formatError = useMemo(() => {
    if (!selected || number.length === 0) return null;
    const res = validateFiscalId(number, selected.code);
    return res.ok ? null : hints.formatError;
  }, [selected, number, hints.formatError]);

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-type`}>{hints.typeLabel}</Label>
        <Select value={typeId} onValueChange={(v) => onTypeChange(v ?? '')}>
          <SelectTrigger id={`${idPrefix}-type`}>
            <SelectValue placeholder={hints.typePlaceholder}>
              {(v: string) => options.find((o) => o.id === v)?.label ?? hints.typePlaceholder}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-number`}>{hints.numberLabel}</Label>
        <Input
          id={`${idPrefix}-number`}
          value={number}
          onChange={(e) => onNumberChange(e.target.value)}
          placeholder={hints.numberPlaceholder}
          aria-invalid={Boolean(formatError) || undefined}
          aria-describedby={formatError ? `${idPrefix}-number-error` : undefined}
        />
        {formatError && (
          <p id={`${idPrefix}-number-error`} className="text-destructive text-xs">
            {formatError}
          </p>
        )}
      </div>
    </div>
  );
}
