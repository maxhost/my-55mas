'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { saveTalentPersonalData } from '../../../actions/save-personal-data';
import type {
  DetailsTabHints,
  PersonalDataValues,
  TalentDetailContext,
} from '../../../types';
import { Field, SectionShell } from './details-tab';

type Props = {
  talentId: string;
  data: PersonalDataValues;
  context: TalentDetailContext;
  hints: DetailsTabHints;
  locale: string;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
};

// Aligned with `GENDER_VALUES` in talent-onboarding/types.ts so admin edits
// stay compatible with the values the rest of the app understands.
const GENDER_OPTIONS = ['male', 'female'] as const;

export function PersonalDataSection({
  talentId,
  data,
  hints,
  open,
  onToggle,
  onSaved,
  onDirtyChange,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PersonalDataValues>(data);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setForm(data);
  }, [data]);

  const dirty = useMemo(
    () =>
      editing &&
      (form.full_name !== data.full_name ||
        form.gender !== data.gender ||
        form.birth_date !== data.birth_date),
    [editing, form, data],
  );

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const previewText = data.full_name
    ? [data.full_name, data.gender, data.birth_date].filter(Boolean).join(' · ')
    : hints.empty;

  const handleSave = () => {
    if (!form.full_name?.trim()) {
      toast.error(hints.section.saveError);
      return;
    }
    startTransition(async () => {
      const res = await saveTalentPersonalData({
        talentId,
        full_name: form.full_name,
        gender: form.gender,
        birth_date: form.birth_date,
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
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Field label={hints.fullNameLabel} value={data.full_name} fallback={hints.notProvided} />
      <Field label={hints.genderLabel} value={data.gender} fallback={hints.notProvided} />
      <Field label={hints.birthDateLabel} value={data.birth_date} fallback={hints.notProvided} />
    </dl>
  );

  const editMode = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pd-full-name">{hints.fullNameLabel}</Label>
        <Input
          id="pd-full-name"
          value={form.full_name ?? ''}
          onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{hints.genderLabel}</Label>
        <Select
          value={form.gender ?? ''}
          onValueChange={(v) => setForm((s) => ({ ...s, gender: v || null }))}
        >
          <SelectTrigger>
            <SelectValue placeholder={hints.notProvided} />
          </SelectTrigger>
          <SelectContent>
            {GENDER_OPTIONS.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pd-birth">{hints.birthDateLabel}</Label>
        <Input
          id="pd-birth"
          type="date"
          value={form.birth_date ?? ''}
          onChange={(e) => setForm((s) => ({ ...s, birth_date: e.target.value || null }))}
        />
      </div>
    </div>
  );

  return (
    <SectionShell
      title={hints.personalDataTitle}
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
      hints={hints}
      previewText={previewText}
      readMode={readMode}
      editMode={editMode}
    />
  );
}

