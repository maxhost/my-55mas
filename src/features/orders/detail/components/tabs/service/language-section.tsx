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
import { saveOrderLanguage } from '../../../actions/save-order-language';
import type {
  LanguageValues,
  ServiceTabContext,
  ServiceTabHints,
} from '../../../types';
import { Field, SectionShell } from './service-tab';

const NONE_VALUE = '__none__';

type Props = {
  orderId: string;
  data: LanguageValues;
  context: ServiceTabContext;
  hints: ServiceTabHints;
  locale: string;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
  readOnly?: boolean;
};

export function LanguageSection({
  orderId,
  data,
  context,
  hints,
  open,
  onToggle,
  onSaved,
  onDirtyChange,
  readOnly = false,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<LanguageValues>(data);
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

  const labelMap = useMemo(
    () => new Map(context.spokenLanguages.map((l) => [l.code, l.name])),
    [context.spokenLanguages],
  );

  const currentName = data.preferred_language
    ? labelMap.get(data.preferred_language) ?? null
    : null;

  const previewText = currentName ?? hints.notProvided;

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveOrderLanguage({
        orderId,
        preferred_language: form.preferred_language,
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
        label={hints.preferredLanguageLabel}
        value={currentName}
        fallback={hints.notProvided}
      />
    </dl>
  );

  const editMode = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label>{hints.preferredLanguageLabel}</Label>
        <Select
          value={form.preferred_language ?? NONE_VALUE}
          onValueChange={(v) =>
            setForm((s) => ({
              ...s,
              preferred_language: v === NONE_VALUE ? null : (v ?? null),
            }))
          }
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
            {context.spokenLanguages.map((l) => (
              <SelectItem key={l.code} value={l.code}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <SectionShell
      title={hints.languageTitle}
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
      readOnly={readOnly}
      sectionHints={hints.section}
      previewText={previewText}
      readMode={readMode}
      editMode={editMode}
    />
  );
}
