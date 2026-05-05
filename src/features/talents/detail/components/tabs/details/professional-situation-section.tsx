'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { saveTalentProfessionalSituation } from '../../../actions/save-professional-situation';
import type {
  DetailsTabHints,
  ProfessionalSituationValues,
  TalentDetailContext,
} from '../../../types';
import { Field, SectionShell } from './details-tab';

type Props = {
  talentId: string;
  data: ProfessionalSituationValues;
  context: TalentDetailContext;
  hints: DetailsTabHints;
  locale: string;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
};

const STATUS_OPTIONS = ['pre_retired', 'unemployed', 'employed', 'retired'] as const;
const NONE_VALUE = '__none__';

export function ProfessionalSituationSection({
  talentId,
  data,
  hints,
  open,
  onToggle,
  onSaved,
  onDirtyChange,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfessionalSituationValues>(data);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setForm(data);
  }, [data]);

  const dirty = useMemo(
    () =>
      editing &&
      (form.professional_status !== data.professional_status ||
        form.previous_experience !== data.previous_experience),
    [editing, form, data],
  );

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const previewText = data.professional_status || hints.empty;

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveTalentProfessionalSituation({
        talentId,
        professional_status: form.professional_status,
        previous_experience: form.previous_experience,
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
    <dl className="grid grid-cols-1 gap-3">
      <Field
        label={hints.professionalStatusLabel}
        value={data.professional_status}
        fallback={hints.notProvided}
      />
      <Field
        label={hints.previousExperienceLabel}
        value={data.previous_experience}
        fallback={hints.notProvided}
      />
    </dl>
  );

  const editMode = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>{hints.professionalStatusLabel}</Label>
        <Select
          value={form.professional_status ?? NONE_VALUE}
          onValueChange={(v) =>
            setForm((s) => ({ ...s, professional_status: v === NONE_VALUE ? null : v }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={hints.notProvided} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>{hints.notProvided}</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ps-prev">{hints.previousExperienceLabel}</Label>
        <Textarea
          id="ps-prev"
          rows={4}
          value={form.previous_experience ?? ''}
          onChange={(e) =>
            setForm((s) => ({ ...s, previous_experience: e.target.value || null }))
          }
        />
      </div>
    </div>
  );

  return (
    <SectionShell
      title={hints.professionalSituationTitle}
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

