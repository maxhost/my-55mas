'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveOrderRecurrence } from '../../../actions/save-order-recurrence';
import type { RecurrenceValues, ServiceTabContext, ServiceTabHints } from '../../../types';
import { RECURRENCE_TYPES } from '../../../types';
import type { OrderScheduleType } from '../../../../types';
import { Field, SectionShell } from './service-tab';

type Props = {
  orderId: string;
  data: RecurrenceValues;
  context: ServiceTabContext;
  hints: ServiceTabHints;
  locale: string;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
};

function buildSummary(form: RecurrenceValues, hints: ServiceTabHints): string {
  const typeLabel = hints.scheduleTypeLabels[form.schedule_type];
  const days = form.weekdays.length > 0
    ? form.weekdays.slice().sort((a, b) => a - b).map((d) => hints.weekdayShort[d] ?? String(d)).join(', ')
    : hints.notProvided;
  const start = form.start_date ?? hints.notProvided;
  const end = form.end_date ?? hints.notProvided;
  return `${typeLabel} · ${hints.repeatEveryLabel}: ${form.repeat_every} · ${hints.weekdaysLabel}: ${days} · ${start} → ${end}`;
}

export function RecurrenceSection({ orderId, data, hints, open, onToggle, onSaved, onDirtyChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<RecurrenceValues>(data);
  const [isPending, startTransition] = useTransition();

  useEffect(() => { setForm(data); }, [data]);
  const dirty = useMemo(() => editing && JSON.stringify(form) !== JSON.stringify(data), [editing, form, data]);
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);

  const scheduleLabelMap = useMemo(
    () => new Map(RECURRENCE_TYPES.map((t) => [t, hints.scheduleTypeLabels[t]])),
    [hints.scheduleTypeLabels],
  );

  const previewText = `${hints.scheduleTypeLabels[data.schedule_type]} · ${data.repeat_every}`;

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveOrderRecurrence({ orderId, ...form });
      if ('error' in res) { toast.error(res.error.message || hints.section.saveError); return; }
      toast.success(hints.section.saveSuccess);
      setEditing(false); onDirtyChange(false); onSaved();
    });
  };

  const setField = <K extends keyof RecurrenceValues>(k: K, v: RecurrenceValues[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const toggleWeekday = (idx: number) => setForm((s) => ({
    ...s,
    weekdays: s.weekdays.includes(idx)
      ? s.weekdays.filter((d) => d !== idx)
      : [...s.weekdays, idx].sort((a, b) => a - b),
  }));

  const weekdaysValue = data.weekdays.length > 0
    ? data.weekdays.map((d) => hints.weekdayShort[d] ?? String(d)).join(', ')
    : null;
  const hpsValue = data.hours_per_session !== null ? String(data.hours_per_session) : null;

  const readMode = (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label={hints.scheduleTypeLabel} value={hints.scheduleTypeLabels[data.schedule_type]} fallback={hints.notProvided} />
      <Field label={hints.repeatEveryLabel} value={String(data.repeat_every)} fallback={hints.notProvided} />
      <Field label={hints.weekdaysLabel} value={weekdaysValue} fallback={hints.notProvided} />
      <Field label={hints.startDateLabel} value={data.start_date} fallback={hints.notProvided} />
      <Field label={hints.endDateLabel} value={data.end_date} fallback={hints.notProvided} />
      <Field label={hints.timeWindowStartLabel} value={data.time_window_start} fallback={hints.notProvided} />
      <Field label={hints.timeWindowEndLabel} value={data.time_window_end} fallback={hints.notProvided} />
      {data.schedule_type !== 'once' && (
        <Field label={hints.hoursPerSessionLabel} value={hpsValue} fallback={hints.notProvided} />
      )}
      <div className="sm:col-span-2 flex flex-col">
        <dt className="text-xs text-muted-foreground">{hints.recurrenceSummaryLabel}</dt>
        <dd className="text-sm whitespace-pre-wrap">{buildSummary(data, hints)}</dd>
      </div>
    </dl>
  );

  const dateField = (id: string, label: string, type: 'date' | 'time', value: string | null, key: keyof RecurrenceValues) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value ?? ''}
        onChange={(e) => setField(key, (e.target.value || null) as RecurrenceValues[typeof key])}
      />
    </div>
  );

  const editMode = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label>{hints.scheduleTypeLabel}</Label>
        <Select
          value={form.schedule_type}
          onValueChange={(v) => setField('schedule_type', (v ?? 'once') as OrderScheduleType)}
        >
          <SelectTrigger>
            <SelectValue placeholder={hints.notProvided}>
              {(v) => (!v ? hints.notProvided : scheduleLabelMap.get(v as OrderScheduleType) ?? hints.notProvided)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {RECURRENCE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{hints.scheduleTypeLabels[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rec-repeat">{hints.repeatEveryLabel}</Label>
        <Input
          id="rec-repeat" type="number" min={1} max={365} value={form.repeat_every}
          onChange={(e) => {
            const n = Number(e.target.value);
            setField('repeat_every', Number.isFinite(n) && n >= 1 ? Math.min(365, n) : 1);
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label>{hints.weekdaysLabel}</Label>
        <div className="flex flex-wrap gap-2">
          {hints.weekdayShort.map((label, idx) => (
            <Button
              key={idx} type="button" size="sm"
              variant={form.weekdays.includes(idx) ? 'default' : 'outline'}
              onClick={() => toggleWeekday(idx)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {dateField('rec-start', hints.startDateLabel, 'date', form.start_date, 'start_date')}
      {dateField('rec-end', hints.endDateLabel, 'date', form.end_date, 'end_date')}
      {dateField('rec-tws', hints.timeWindowStartLabel, 'time', form.time_window_start, 'time_window_start')}
      {dateField('rec-twe', hints.timeWindowEndLabel, 'time', form.time_window_end, 'time_window_end')}

      {form.schedule_type !== 'once' && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rec-hps">{hints.hoursPerSessionLabel}</Label>
          <Input
            id="rec-hps" type="number" min={0} max={24} step={0.5}
            value={form.hours_per_session ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') { setField('hours_per_session', null); return; }
              const n = Number(v);
              setField('hours_per_session', Number.isFinite(n) ? n : null);
            }}
          />
        </div>
      )}

      <div className="sm:col-span-2 flex flex-col">
        <dt className="text-xs text-muted-foreground">{hints.recurrenceSummaryLabel}</dt>
        <dd className="text-sm whitespace-pre-wrap">{buildSummary(form, hints)}</dd>
      </div>
    </div>
  );

  return (
    <SectionShell
      title={hints.recurrenceTitle}
      open={open} onToggle={onToggle} editing={editing}
      onStartEdit={() => { setForm(data); setEditing(true); }}
      onCancelEdit={() => { setForm(data); setEditing(false); onDirtyChange(false); }}
      onSave={handleSave} saving={isPending}
      sectionHints={hints.section} previewText={previewText}
      readMode={readMode} editMode={editMode}
    />
  );
}
