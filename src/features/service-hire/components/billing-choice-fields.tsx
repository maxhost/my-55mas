'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { FiscalIdTypeOption } from '../actions/list-fiscal-id-types';
import type { BillingChoiceValue } from '../types';
import { FiscalIdInput } from './fiscal-id-input';

type Props = {
  value: BillingChoiceValue;
  onChange: (v: BillingChoiceValue) => void;
  fiscalIdTypes: FiscalIdTypeOption[];
  hints: {
    legend: string;
    same: string;
    custom: string;
    name: string;
    phone: string;
    fiscalType: string;
    fiscalTypePlaceholder: string;
    fiscalNumber: string;
    fiscalNumberPlaceholder: string;
    formatError: string;
  };
};

export function BillingChoiceFields({ value, onChange, fiscalIdTypes, hints }: Props) {
  return (
    <fieldset className="space-y-3 rounded-md border p-4">
      <legend className="text-sm font-medium">{hints.legend}</legend>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="billing-mode"
            value="same"
            checked={value.mode === 'same'}
            onChange={() => onChange({ mode: 'same' })}
          />
          <span>{hints.same}</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="billing-mode"
            value="custom"
            checked={value.mode === 'custom'}
            onChange={() =>
              onChange({
                mode: 'custom',
                data: { name: '', phone: '', fiscal_id_type_id: '', fiscal_id: '' },
              })
            }
          />
          <span>{hints.custom}</span>
        </label>
      </div>

      {value.mode === 'custom' && (
        <div className="space-y-3 border-t pt-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="billing-name">{hints.name}</Label>
              <Input
                id="billing-name"
                value={value.data.name}
                onChange={(e) =>
                  onChange({ mode: 'custom', data: { ...value.data, name: e.target.value } })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="billing-phone">{hints.phone}</Label>
              <Input
                id="billing-phone"
                type="tel"
                value={value.data.phone}
                onChange={(e) =>
                  onChange({ mode: 'custom', data: { ...value.data, phone: e.target.value } })
                }
              />
            </div>
          </div>
          <FiscalIdInput
            idPrefix="billing"
            options={fiscalIdTypes}
            typeId={value.data.fiscal_id_type_id}
            number={value.data.fiscal_id}
            onTypeChange={(id) =>
              onChange({ mode: 'custom', data: { ...value.data, fiscal_id_type_id: id } })
            }
            onNumberChange={(n) =>
              onChange({ mode: 'custom', data: { ...value.data, fiscal_id: n } })
            }
            hints={{
              typeLabel: hints.fiscalType,
              typePlaceholder: hints.fiscalTypePlaceholder,
              numberLabel: hints.fiscalNumber,
              numberPlaceholder: hints.fiscalNumberPlaceholder,
              formatError: hints.formatError,
            }}
          />
        </div>
      )}
    </fieldset>
  );
}
