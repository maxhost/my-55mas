'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { saveTalentLanguages } from '../../../actions/save-languages';
import type {
  DetailsTabHints,
  LanguagesValues,
  TalentDetailContext,
} from '../../../types';
import { SectionShell } from './details-tab';

type Props = {
  talentId: string;
  data: LanguagesValues;
  context: TalentDetailContext;
  hints: DetailsTabHints;
  locale: string;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
};

const ADD_PLACEHOLDER = '__add__';

export function LanguagesSection({
  talentId,
  data,
  context,
  hints,
  open,
  onToggle,
  onSaved,
  onDirtyChange,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [codes, setCodes] = useState<string[]>(data.language_codes);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCodes(data.language_codes);
  }, [data.language_codes]);

  const dirty = useMemo(() => {
    if (!editing) return false;
    if (codes.length !== data.language_codes.length) return true;
    const sortedA = [...codes].sort();
    const sortedB = [...data.language_codes].sort();
    return sortedA.some((c, i) => c !== sortedB[i]);
  }, [editing, codes, data.language_codes]);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const lookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of context.spokenLanguages) map.set(l.code, l.name);
    return map;
  }, [context.spokenLanguages]);

  const previewText =
    data.language_codes.length === 0
      ? hints.empty
      : data.language_codes.map((c) => lookup.get(c) ?? c).join(' · ');

  const addable = context.spokenLanguages.filter((l) => !codes.includes(l.code));

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveTalentLanguages({ talentId, language_codes: codes });
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

  const renderChips = (removable: boolean) =>
    data.language_codes.length === 0 && !editing ? (
      <p className="text-sm text-muted-foreground">{hints.empty}</p>
    ) : (
      <div className="flex flex-wrap gap-2">
        {(editing ? codes : data.language_codes).map((code) => (
          <Badge key={code} variant="secondary" className="gap-1">
            {lookup.get(code) ?? code}
            {removable && (
              <button
                type="button"
                aria-label={hints.languageRemove}
                onClick={() => setCodes((prev) => prev.filter((c) => c !== code))}
                className="ml-1 inline-flex"
              >
                <X className="size-3" />
              </button>
            )}
          </Badge>
        ))}
        {editing && codes.length === 0 && (
          <p className="text-sm text-muted-foreground">{hints.empty}</p>
        )}
      </div>
    );

  const editMode = (
    <div className="flex flex-col gap-3">
      {renderChips(true)}
      {addable.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label>{hints.languageAddButton}</Label>
          <Select
            value={ADD_PLACEHOLDER}
            onValueChange={(v) => {
              if (v && v !== ADD_PLACEHOLDER && !codes.includes(v)) {
                setCodes((prev) => [...prev, v]);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={hints.languageAddButton}>
                {() => hints.languageAddButton}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ADD_PLACEHOLDER} disabled>
                {hints.languageAddButton}
              </SelectItem>
              {addable.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  return (
    <SectionShell
      title={hints.languagesTitle}
      open={open}
      onToggle={onToggle}
      editing={editing}
      onStartEdit={() => {
        setCodes(data.language_codes);
        setEditing(true);
      }}
      onCancelEdit={() => {
        setCodes(data.language_codes);
        setEditing(false);
        onDirtyChange(false);
      }}
      onSave={handleSave}
      saving={isPending}
      hints={hints}
      previewText={previewText}
      readMode={renderChips(false)}
      editMode={editMode}
    />
  );
}

