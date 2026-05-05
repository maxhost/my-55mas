'use client';

import { Cog, Pin } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createTalentNote } from '@/features/talents/detail/actions/create-talent-note';
import { pinTalentNote } from '@/features/talents/detail/actions/pin-talent-note';
import type { NotesTabHints, TalentNote } from '@/features/talents/detail/types';
import { cn } from '@/lib/utils';

type Props = {
  talentId: string;
  initialNotes: TalentNote[];
  hints: NotesTabHints;
  currentUserName: string;
  locale: string;
};

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

function formatRelative(value: string, hints: NotesTabHints, locale: string): string {
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return value;
  const deltaSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));

  if (deltaSec < MINUTE) return hints.relativeJustNow;
  if (deltaSec < HOUR) {
    const count = Math.floor(deltaSec / MINUTE);
    return hints.relativeMinutes.replace('{count}', String(count));
  }
  if (deltaSec < DAY) {
    const count = Math.floor(deltaSec / HOUR);
    return hints.relativeHours.replace('{count}', String(count));
  }
  if (deltaSec < WEEK) {
    const count = Math.floor(deltaSec / DAY);
    return hints.relativeDays.replace('{count}', String(count));
  }
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(ts));
  } catch {
    return new Date(ts).toISOString().slice(0, 10);
  }
}

function sortNotes(notes: TalentNote[]): TalentNote[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function NotesTab({ talentId, initialNotes, hints, currentUserName, locale }: Props) {
  const [notes, setNotes] = useState<TalentNote[]>(() => sortNotes(initialNotes));
  const [body, setBody] = useState('');
  const [isPending, startTransition] = useTransition();

  // currentUserName is part of the contract for future "you" indicator; reference it
  // here so the prop isn't dropped if the composer evolves.
  void currentUserName;

  const sortedNotes = useMemo(() => sortNotes(notes), [notes]);
  const trimmed = body.trim();
  const canSubmit = trimmed.length > 0 && !isPending;

  function handleSubmit() {
    if (!canSubmit) return;
    const payload = { talentId, body: trimmed };
    startTransition(async () => {
      const result = await createTalentNote(payload);
      if ('error' in result) {
        toast.error(result.error.message || hints.errorSaving);
        return;
      }
      setNotes((prev) => sortNotes([result.data, ...prev]));
      setBody('');
    });
  }

  function handleTogglePin(note: TalentNote) {
    const nextPinned = !note.pinned;
    startTransition(async () => {
      const result = await pinTalentNote({ noteId: note.id, pinned: nextPinned });
      if ('error' in result) {
        toast.error(result.error.message || hints.errorSaving);
        return;
      }
      setNotes((prev) =>
        sortNotes(prev.map((n) => (n.id === note.id ? { ...n, pinned: nextPinned } : n))),
      );
    });
  }

  return (
    <div className="flex flex-col gap-6">
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

      {sortedNotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{hints.empty}</p>
      ) : (
        <ul className="flex flex-col">
          {sortedNotes.map((note) => {
            const author = note.is_system
              ? hints.systemAuthor
              : (note.author_name ?? hints.systemAuthor);
            const relative = formatRelative(note.created_at, hints, locale);
            return (
              <li
                key={note.id}
                className={cn(
                  'flex flex-col gap-2 border-b py-3 last:border-b-0',
                  note.is_system && 'bg-muted/50 px-3 rounded-md text-muted-foreground',
                )}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {note.is_system ? <Cog className="h-3.5 w-3.5" aria-hidden /> : null}
                    <span className="font-medium">{author}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{relative}</span>
                    {note.pinned ? (
                      <Badge variant="secondary" className="ml-1 gap-1">
                        <Pin className="h-3 w-3" aria-hidden />
                        {hints.pinnedLabel}
                      </Badge>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePin(note)}
                    disabled={isPending}
                    aria-label={note.pinned ? hints.unpinAction : hints.pinAction}
                    title={note.pinned ? hints.unpinAction : hints.pinAction}
                  >
                    <Pin
                      className={cn('h-4 w-4', note.pinned && 'fill-current')}
                      aria-hidden
                    />
                  </Button>
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
