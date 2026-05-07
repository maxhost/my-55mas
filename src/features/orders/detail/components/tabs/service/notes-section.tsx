'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { saveOrderNotes } from '../../../actions/save-order-notes';
import type {
  NotesValues,
  ServiceTabContext,
  ServiceTabHints,
} from '../../../types';
import { Field, SectionShell } from './service-tab';

type Props = {
  orderId: string;
  data: NotesValues;
  context: ServiceTabContext;
  hints: ServiceTabHints;
  locale: string;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
};

export function NotesSection({
  orderId,
  data,
  hints,
  open,
  onToggle,
  onSaved,
  onDirtyChange,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<NotesValues>(data);
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

  const previewText = data.notes
    ? data.notes.length > 80
      ? `${data.notes.slice(0, 80)}…`
      : data.notes
    : hints.notProvided;

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveOrderNotes({
        orderId,
        notes: form.notes,
        talents_needed: form.talents_needed,
      });
      if ('error' in res) {
        toast.error(res.error.message || hints.section.saveError);
        return;
      }
      toast.success(hints.section.saveSuccess);
      setEditing(false);
      onDirtyChange(false);
      onSaved();
    });
  };

  const readMode = (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field
        label={hints.talentsNeededLabel}
        value={String(data.talents_needed)}
        fallback={hints.notProvided}
      />
      <div className="sm:col-span-2 flex flex-col">
        <dt className="text-xs text-muted-foreground">{hints.notesLabel}</dt>
        <dd className="text-sm whitespace-pre-wrap">{data.notes || hints.notProvided}</dd>
      </div>
    </dl>
  );

  const editMode = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ns-talents-needed">{hints.talentsNeededLabel}</Label>
        <Input
          id="ns-talents-needed"
          type="number"
          min={1}
          max={50}
          value={form.talents_needed}
          onChange={(e) => {
            const n = Number(e.target.value);
            setForm((s) => ({
              ...s,
              talents_needed: Number.isFinite(n) && n >= 1 ? Math.min(50, Math.floor(n)) : 1,
            }));
          }}
        />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="ns-notes">{hints.notesLabel}</Label>
        <Textarea
          id="ns-notes"
          value={form.notes ?? ''}
          onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value || null }))}
          rows={4}
        />
      </div>
    </div>
  );

  return (
    <SectionShell
      title={hints.notesTitle}
      open={open}
      onToggle={onToggle}
      editing={editing}
      onStartEdit={() => {
        setForm(data);
        setEditing(true);
      }}
      onCancelEdit={() => {
        setForm(data);
        setEditing(false);
        onDirtyChange(false);
      }}
      onSave={handleSave}
      saving={isPending}
      sectionHints={hints.section}
      previewText={previewText}
      readMode={readMode}
      editMode={editMode}
    />
  );
}
