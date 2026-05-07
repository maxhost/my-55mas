'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { addOrderActivityNote } from '@/features/orders/detail/actions/add-order-activity-note';
import type {
  ActivityTabHints,
  OrderActivityNote,
} from '@/features/orders/detail/types';
import { cn } from '@/lib/utils';

type Props = {
  orderId: string;
  initialNotes: OrderActivityNote[];
  hints: ActivityTabHints;
  locale: string;
  readOnly?: boolean;
};

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

function formatRelative(value: string, locale: string, hints: ActivityTabHints): string {
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return value;
  const deltaSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));

  if (deltaSec < MINUTE) return hints.relativeJustNow;
  if (deltaSec < HOUR) {
    const count = Math.floor(deltaSec / MINUTE);
    return hints.relativeMinutes.replace('[count]', String(count));
  }
  if (deltaSec < DAY) {
    const count = Math.floor(deltaSec / HOUR);
    return hints.relativeHours.replace('[count]', String(count));
  }
  if (deltaSec < WEEK) {
    const count = Math.floor(deltaSec / DAY);
    return hints.relativeDays.replace('[count]', String(count));
  }
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(ts));
  } catch {
    return new Date(ts).toISOString().slice(0, 10);
  }
}

function sortNotes(notes: OrderActivityNote[]): OrderActivityNote[] {
  return [...notes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function ActivityTab({
  orderId,
  initialNotes,
  hints,
  locale,
  readOnly = false,
}: Props) {
  const [notes, setNotes] = useState<OrderActivityNote[]>(() => sortNotes(initialNotes));
  const [body, setBody] = useState('');
  const [isPending, startTransition] = useTransition();

  const trimmed = body.trim();
  const canSubmit = trimmed.length > 0 && !isPending;

  function handleSubmit() {
    if (!canSubmit) return;
    const payload = { orderId, body: trimmed };
    startTransition(async () => {
      const result = await addOrderActivityNote(payload);
      if ('error' in result) {
        toast.error(result.error.message || hints.errorSaving);
        return;
      }
      setNotes((prev) => sortNotes([result.data, ...prev]));
      setBody('');
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {!readOnly && (
        <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={hints.composerPlaceholder}
            rows={3}
            disabled={isPending}
          />
          <div className="flex justify-end">
            <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
              {hints.addButton}
            </Button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{hints.empty}</p>
      ) : (
        <ul className="flex flex-col">
          {notes.map((note) => {
            const author = note.is_system
              ? hints.systemAuthor
              : (note.author_name ?? hints.systemAuthor);
            const relative = formatRelative(note.created_at, locale, hints);
            return (
              <li
                key={note.id}
                className={cn(
                  'flex flex-col gap-2 border-b py-3 last:border-b-0',
                  note.is_system && 'rounded-md bg-muted/50 px-3 text-muted-foreground',
                )}
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium">{author}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{relative}</span>
                </div>
                <p className="whitespace-pre-line text-sm">{note.body}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
