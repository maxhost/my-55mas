'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveTalentPaymentPrefs } from '../../../actions/save-payment-prefs';
import type { DetailsTabHints, PaymentPrefsValues, TalentDetailContext } from '../../../types';
import { Field, SectionShell } from './details-tab';

type Props = {
  talentId: string;
  data: PaymentPrefsValues;
  context: TalentDetailContext;
  hints: DetailsTabHints;
  locale: string;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
};

const PAYMENT_OPTIONS = ['monthly_invoice', 'accumulate_credit'] as const;
const NONE_VALUE = '__none__';

export function PaymentPrefsSection({
  talentId, data, context, hints, open, onToggle, onSaved, onDirtyChange,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PaymentPrefsValues>(data);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setForm(data);
  }, [data]);

  const dirty = useMemo(
    () => editing && JSON.stringify(form) !== JSON.stringify(data),
    [editing, form, data],
  );

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const fiscalTypeLabel = data.fiscal_id_type_id
    ? context.fiscalIdTypes.find((t) => t.id === data.fiscal_id_type_id)?.label ?? null
    : null;

  const previewParts = [data.preferred_payment, data.fiscal_id].filter(Boolean);
  const previewText = previewParts.length > 0 ? previewParts.join(' · ') : hints.empty;

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveTalentPaymentPrefs({ talentId, ...form });
      if ('error' in res) { toast.error(res.error.message || hints.section.saveError); return; }
      toast.success(hints.section.saveSuccess);
      setEditing(false); onDirtyChange(false); onSaved();
    });
  };

  const readMode = (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label={hints.preferredPaymentLabel} value={data.preferred_payment} fallback={hints.notProvided} />
      <Field
        label={hints.hasSocialSecurityLabel}
        value={data.has_social_security === null ? null : data.has_social_security ? 'Sí' : 'No'}
        fallback={hints.notProvided}
      />
      <Field label={hints.fiscalIdTypeLabel} value={fiscalTypeLabel} fallback={hints.notProvided} />
      <Field label={hints.fiscalIdLabel} value={data.fiscal_id} fallback={hints.notProvided} />
    </dl>
  );

  const renderSelect = (
    label: string, value: string | null, set: (v: string | null) => void,
    opts: { value: string; label: string }[],
  ) => {
    const labelMap = new Map(opts.map((o) => [o.value, o.label]));
    return (
      <div className="flex flex-col gap-1.5">
        <Label>{label}</Label>
        <Select
          value={value ?? NONE_VALUE}
          onValueChange={(v) => set(v === NONE_VALUE ? null : (v ?? null))}
        >
          <SelectTrigger>
            <SelectValue placeholder={hints.notProvided}>
              {(v) =>
                v === NONE_VALUE || !v
                  ? hints.notProvided
                  : labelMap.get(v as string) ?? hints.notProvided
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>{hints.notProvided}</SelectItem>
            {opts.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const editMode = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {renderSelect(
        hints.preferredPaymentLabel, form.preferred_payment,
        (v) => setForm((s) => ({ ...s, preferred_payment: v })),
        PAYMENT_OPTIONS.map((p) => ({ value: p, label: p })),
      )}
      <label className="flex items-center gap-2 self-end">
        <Checkbox
          checked={form.has_social_security ?? false}
          onCheckedChange={(c) => setForm((s) => ({ ...s, has_social_security: Boolean(c) }))}
        />
        <span className="text-sm">{hints.hasSocialSecurityLabel}</span>
      </label>
      {renderSelect(
        hints.fiscalIdTypeLabel, form.fiscal_id_type_id,
        (v) => setForm((s) => ({ ...s, fiscal_id_type_id: v })),
        context.fiscalIdTypes.map((t) => ({ value: t.id, label: t.label })),
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pp-fiscal-id">{hints.fiscalIdLabel}</Label>
        <Input
          id="pp-fiscal-id"
          value={form.fiscal_id ?? ''}
          onChange={(e) => setForm((s) => ({ ...s, fiscal_id: e.target.value || null }))}
        />
      </div>
    </div>
  );

  return (
    <SectionShell
      title={hints.paymentPrefsTitle}
      open={open} onToggle={onToggle} editing={editing}
      onStartEdit={() => { setForm(data); setEditing(true); }}
      onCancelEdit={() => { setForm(data); setEditing(false); onDirtyChange(false); }}
      onSave={handleSave} saving={isPending}
      hints={hints} previewText={previewText} readMode={readMode} editMode={editMode}
    />
  );
}

