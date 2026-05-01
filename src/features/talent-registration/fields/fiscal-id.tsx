'use client';

import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FiscalIdTypeOption } from '../types';

export const fiscalIdTypeIdSchema = z.string().uuid();
export const fiscalIdSchema = z.string().min(4).max(50);

type Props = {
  fiscalIdTypes: FiscalIdTypeOption[];
  countryId: string;
  typeValue: string;
  valueValue: string;
  onTypeChange: (id: string) => void;
  onValueChange: (value: string) => void;
  typeLabel: string;
  valueLabel: string;
  typePlaceholder?: string;
  valuePlaceholder?: string;
  typeHelp?: string;
  typeError?: string;
  valueError?: string;
  required?: boolean;
  disabled?: boolean;
  typeFieldId?: string;
  valueFieldId?: string;
};

export function FiscalIdField({
  fiscalIdTypes,
  countryId,
  typeValue,
  valueValue,
  onTypeChange,
  onValueChange,
  typeLabel,
  valueLabel,
  typePlaceholder,
  valuePlaceholder,
  typeHelp,
  typeError,
  valueError,
  required,
  disabled,
  typeFieldId,
  valueFieldId,
}: Props) {
  const availableTypes = fiscalIdTypes.filter((t) =>
    countryId ? t.countryIds.includes(countryId) : false,
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={typeFieldId}>
          {typeLabel}
          {required ? <span aria-hidden> *</span> : null}
        </Label>
        <Select
          value={typeValue}
          onValueChange={(v) => onTypeChange(v ?? '')}
          disabled={disabled || !countryId || availableTypes.length === 0}
        >
          <SelectTrigger id={typeFieldId} aria-invalid={typeError ? 'true' : undefined}>
            <SelectValue placeholder={typePlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {availableTypes.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {typeHelp ? <p className="text-sm text-muted-foreground">{typeHelp}</p> : null}
        {typeError ? <p className="text-sm text-destructive">{typeError}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={valueFieldId}>
          {valueLabel}
          {required ? <span aria-hidden> *</span> : null}
        </Label>
        <Input
          id={valueFieldId}
          type="text"
          value={valueValue}
          placeholder={valuePlaceholder}
          onChange={(e) => onValueChange(e.target.value)}
          disabled={disabled || !typeValue}
          aria-invalid={valueError ? 'true' : undefined}
        />
        {valueError ? <p className="text-sm text-destructive">{valueError}</p> : null}
      </div>
    </div>
  );
}
