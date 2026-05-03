'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SchedulingValue } from '../types';

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

type Props = {
  value: SchedulingValue;
  onChange: (v: SchedulingValue) => void;
  hints: {
    title: string;
    scheduleType: string;
    once: string;
    recurring: string;
    date: string;
    timeStart: string;
    timeEnd: string;
    frequency: string;
    weekly: string;
    monthly: string;
    weekdays: string;
    dayOfMonth: string;
    endDate: string;
  };
};

export function SchedulingBlock({ value, onChange, hints }: Props) {
  const isRecurring = value.schedule_type === 'recurring';

  const toggleWeekday = (idx: number, checked: boolean) => {
    const current = value.weekdays ?? [];
    onChange({
      ...value,
      weekdays: checked ? [...current, idx] : current.filter((d) => d !== idx),
    });
  };

  return (
    <fieldset className="space-y-3 rounded-md border p-4">
      <legend className="text-sm font-medium">{hints.title}</legend>

      <div className="space-y-1.5">
        <Label>{hints.scheduleType}</Label>
        <Select
          value={value.schedule_type}
          onValueChange={(v) =>
            onChange({
              ...value,
              schedule_type: ((v ?? 'once') as SchedulingValue['schedule_type']),
            })
          }
        >
          <SelectTrigger>
            <SelectValue>
              {(v: string) => (v === 'recurring' ? hints.recurring : hints.once)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="once">{hints.once}</SelectItem>
            <SelectItem value="recurring">{hints.recurring}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="sched-date">{hints.date}</Label>
          <Input
            id="sched-date"
            type="date"
            value={value.start_date}
            onChange={(e) => onChange({ ...value, start_date: e.target.value })}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sched-start">{hints.timeStart}</Label>
          <Input
            id="sched-start"
            type="time"
            value={value.time_start}
            onChange={(e) => onChange({ ...value, time_start: e.target.value })}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sched-end">{hints.timeEnd}</Label>
          <Input
            id="sched-end"
            type="time"
            value={value.time_end ?? ''}
            onChange={(e) => onChange({ ...value, time_end: e.target.value || undefined })}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {isRecurring && (
        <div className="space-y-3 border-t pt-3">
          <div className="space-y-1.5">
            <Label>{hints.frequency}</Label>
            <Select
              value={value.frequency ?? 'weekly'}
              onValueChange={(v) =>
                onChange({
                  ...value,
                  frequency: ((v ?? 'weekly') as 'weekly' | 'monthly'),
                  weekdays: v === 'weekly' ? value.weekdays ?? [] : undefined,
                  day_of_month: v === 'monthly' ? value.day_of_month ?? 1 : undefined,
                })
              }
            >
              <SelectTrigger>
                <SelectValue>
                  {(v: string) => (v === 'monthly' ? hints.monthly : hints.weekly)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">{hints.weekly}</SelectItem>
                <SelectItem value="monthly">{hints.monthly}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {value.frequency === 'weekly' && (
            <div className="space-y-1.5">
              <Label>{hints.weekdays}</Label>
              <div className="flex gap-2">
                {WEEKDAY_LABELS.map((wd, i) => {
                  const checked = (value.weekdays ?? []).includes(i);
                  return (
                    <label
                      key={i}
                      className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border text-xs ${
                        checked ? 'bg-primary text-primary-foreground' : 'bg-background'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={(e) => toggleWeekday(i, e.target.checked)}
                      />
                      {wd}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {value.frequency === 'monthly' && (
            <div className="space-y-1.5">
              <Label htmlFor="sched-dom">{hints.dayOfMonth}</Label>
              <Input
                id="sched-dom"
                type="number"
                min={1}
                max={31}
                value={value.day_of_month ?? 1}
                onChange={(e) =>
                  onChange({ ...value, day_of_month: Number(e.target.value) || 1 })
                }
                className="h-9 w-24 text-sm"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="sched-end-date">{hints.endDate}</Label>
            <Input
              id="sched-end-date"
              type="date"
              value={value.end_date ?? ''}
              onChange={(e) => onChange({ ...value, end_date: e.target.value || undefined })}
              className="h-9 text-sm"
            />
          </div>
        </div>
      )}
    </fieldset>
  );
}
