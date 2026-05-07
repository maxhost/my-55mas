'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveClientPersonalData } from '../../../actions/save-personal-data';
import type { ClientDetailContext, DetailsTabHints, PersonalDataValues } from '../../../types';
import { Field, SectionShell } from './details-tab';

type Props = {
  clientId: string;
  data: PersonalDataValues;
  context: ClientDetailContext;
  hints: DetailsTabHints;
  locale: string;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
};

const BUSINESS_TRUE = 'business';
const BUSINESS_FALSE = 'individual';

export function PersonalDataSection({
  clientId, data, hints, open, onToggle, onSaved, onDirtyChange,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PersonalDataValues>(data);
  const [isPending, startTransition] = useTransition();

  useEffect(() => { setForm(data); }, [data]);

  const dirty = useMemo(
    () => editing && JSON.stringify(form) !== JSON.stringify(data),
    [editing, form, data],
  );

  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);

  const typeLabel = data.is_business ? hints.typeBusiness : hints.typeIndividual;
  const previewParts = [
    data.full_name,
    typeLabel,
    data.is_business ? data.company_name : null,
  ].filter((s): s is string => Boolean(s && s.length > 0));
  const previewText = previewParts.length > 0 ? previewParts.join(' · ') : hints.empty;

  const handleSave = () => {
    if (!form.full_name?.trim()) { toast.error(hints.section.saveError); return; }
    startTransition(async () => {
      const res = await saveClientPersonalData({
        clientId,
        full_name: form.full_name,
        is_business: form.is_business,
        company_name: form.is_business ? form.company_name : null,
        phone: form.phone,
      });
      if ('error' in res) { toast.error(res.error.message || hints.section.saveError); return; }
      toast.success(hints.section.saveSuccess);
      setEditing(false); onDirtyChange(false); onSaved();
    });
  };

  const readMode = (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label={hints.fullNameLabel} value={data.full_name} fallback={hints.notProvided} />
      <Field label={hints.isBusinessLabel} value={typeLabel} fallback={hints.notProvided} />
      <Field
        label={hints.companyNameLabel}
        value={data.is_business ? data.company_name : null}
        fallback={hints.notProvided}
      />
      <Field label={hints.phoneLabel} value={data.phone} fallback={hints.notProvided} />
    </dl>
  );

  const businessLabelMap = new Map<string, string>([
    [BUSINESS_TRUE, hints.typeBusiness],
    [BUSINESS_FALSE, hints.typeIndividual],
  ]);

  const editMode = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cpd-full-name">{hints.fullNameLabel}</Label>
        <Input
          id="cpd-full-name"
          value={form.full_name ?? ''}
          onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{hints.isBusinessLabel}</Label>
        <Select
          value={form.is_business ? BUSINESS_TRUE : BUSINESS_FALSE}
          onValueChange={(v) =>
            setForm((s) => ({
              ...s,
              is_business: v === BUSINESS_TRUE,
              company_name: v === BUSINESS_TRUE ? s.company_name : null,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={hints.notProvided}>
              {(v) =>
                !v
                  ? hints.notProvided
                  : businessLabelMap.get(v as string) ?? hints.notProvided
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={BUSINESS_TRUE}>{hints.typeBusiness}</SelectItem>
            <SelectItem value={BUSINESS_FALSE}>{hints.typeIndividual}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cpd-company">{hints.companyNameLabel}</Label>
        <Input
          id="cpd-company"
          value={form.company_name ?? ''}
          onChange={(e) =>
            setForm((s) => ({ ...s, company_name: e.target.value || null }))
          }
          disabled={!form.is_business}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cpd-phone">{hints.phoneLabel}</Label>
        <Input
          id="cpd-phone"
          value={form.phone ?? ''}
          onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value || null }))}
        />
      </div>
    </div>
  );

  return (
    <SectionShell
      title={hints.personalDataTitle}
      open={open} onToggle={onToggle} editing={editing}
      onStartEdit={() => { setForm(data); setEditing(true); }}
      onCancelEdit={() => { setForm(data); setEditing(false); onDirtyChange(false); }}
      onSave={handleSave} saving={isPending}
      hints={hints} previewText={previewText} readMode={readMode} editMode={editMode}
    />
  );
}
