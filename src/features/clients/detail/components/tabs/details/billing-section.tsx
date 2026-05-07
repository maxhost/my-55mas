'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveClientBilling } from '../../../actions/save-billing';
import type { BillingValues, ClientDetailContext, DetailsTabHints } from '../../../types';
import { Field, SectionShell } from './details-tab';

type Props = {
  clientId: string;
  data: BillingValues;
  context: ClientDetailContext;
  hints: DetailsTabHints;
  locale: string;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
};

const NONE_VALUE = '__none__';

export function BillingSection({
  clientId, data, context, hints, open, onToggle, onSaved, onDirtyChange,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<BillingValues>(data);
  const [isPending, startTransition] = useTransition();

  useEffect(() => { setForm(data); }, [data]);

  const dirty = useMemo(
    () => editing && JSON.stringify(form) !== JSON.stringify(data),
    [editing, form, data],
  );

  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);

  const fiscalLabel = data.fiscal_id_type_id
    ? context.fiscalIdTypes.find((t) => t.id === data.fiscal_id_type_id)?.label ?? null
    : null;

  const previewParts = [
    data.company_tax_id,
    fiscalLabel,
    data.billing_address,
  ].filter((s): s is string => Boolean(s && s.length > 0));
  const previewText = previewParts.length > 0 ? previewParts.join(' · ') : hints.empty;

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveClientBilling({ clientId, ...form });
      if ('error' in res) { toast.error(res.error.message || hints.section.saveError); return; }
      toast.success(hints.section.saveSuccess);
      setEditing(false); onDirtyChange(false); onSaved();
    });
  };

  const setField = <K extends keyof BillingValues>(k: K, v: BillingValues[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const fiscalOptions = context.fiscalIdTypes.map((t) => ({
    value: t.id,
    label: t.label,
  }));
  const fiscalLabelMap = new Map(fiscalOptions.map((o) => [o.value, o.label]));

  const readMode = (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label={hints.fiscalIdTypeLabel} value={fiscalLabel} fallback={hints.notProvided} />
      <Field label={hints.fiscalIdLabel} value={data.company_tax_id} fallback={hints.notProvided} />
      <Field label={hints.billingAddressLabel} value={data.billing_address} fallback={hints.notProvided} />
      <Field label={hints.billingStateLabel} value={data.billing_state} fallback={hints.notProvided} />
      <Field label={hints.billingPostalCodeLabel} value={data.billing_postal_code} fallback={hints.notProvided} />
    </dl>
  );

  const renderInput = (
    id: string,
    label: string,
    key: keyof BillingValues,
    colSpan = false,
  ) => (
    <div className={`flex flex-col gap-1.5${colSpan ? ' sm:col-span-2' : ''}`}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={(form[key] as string | null) ?? ''}
        onChange={(e) => setField(key, (e.target.value || null) as BillingValues[typeof key])}
      />
    </div>
  );

  const editMode = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label>{hints.fiscalIdTypeLabel}</Label>
        <Select
          value={form.fiscal_id_type_id ?? NONE_VALUE}
          onValueChange={(v) =>
            setField('fiscal_id_type_id', v === NONE_VALUE ? null : (v ?? null))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={hints.notProvided}>
              {(v) =>
                v === NONE_VALUE || !v
                  ? hints.notProvided
                  : fiscalLabelMap.get(v as string) ?? hints.notProvided
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>{hints.notProvided}</SelectItem>
            {fiscalOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {renderInput('cb-tax-id', hints.fiscalIdLabel, 'company_tax_id')}
      {renderInput('cb-address', hints.billingAddressLabel, 'billing_address', true)}
      {renderInput('cb-state', hints.billingStateLabel, 'billing_state')}
      {renderInput('cb-postal', hints.billingPostalCodeLabel, 'billing_postal_code')}
    </div>
  );

  return (
    <SectionShell
      title={hints.billingTitle}
      open={open} onToggle={onToggle} editing={editing}
      onStartEdit={() => { setForm(data); setEditing(true); }}
      onCancelEdit={() => { setForm(data); setEditing(false); onDirtyChange(false); }}
      onSave={handleSave} saving={isPending}
      hints={hints} previewText={previewText} readMode={readMode} editMode={editMode}
    />
  );
}
