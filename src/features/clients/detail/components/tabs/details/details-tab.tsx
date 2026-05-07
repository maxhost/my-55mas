'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { ChevronDown, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  ClientDetailContext,
  ClientDetailsData,
  DetailsTabHints,
} from '../../../types';
import { PersonalDataSection } from './personal-data-section';
import { ContactSection } from './contact-section';
import { BillingSection } from './billing-section';

export type SectionKey = 'personal' | 'contact' | 'billing';

type Props = {
  clientId: string;
  data: ClientDetailsData;
  context: ClientDetailContext;
  hints: DetailsTabHints;
  locale: string;
  onSectionSaved: () => void;
};

const INITIAL_DIRTY: Record<SectionKey, boolean> = {
  personal: false,
  contact: false,
  billing: false,
};

export function DetailsTab({
  clientId,
  data,
  context,
  hints,
  locale,
  onSectionSaved,
}: Props) {
  const [openSection, setOpenSection] = useState<SectionKey | null>('personal');
  const [dirtyMap, setDirtyMap] = useState<Record<SectionKey, boolean>>(INITIAL_DIRTY);

  const setDirty = useCallback((key: SectionKey, dirty: boolean) => {
    setDirtyMap((prev) => (prev[key] === dirty ? prev : { ...prev, [key]: dirty }));
  }, []);

  const handleToggle = useCallback(
    (key: SectionKey) => {
      const next: SectionKey | null = openSection === key ? null : key;
      if (openSection && openSection !== next && dirtyMap[openSection]) {
        if (!window.confirm(hints.section.unsavedPrompt)) return;
        setDirty(openSection, false);
      }
      setOpenSection(next);
    },
    [openSection, dirtyMap, hints.section.unsavedPrompt, setDirty],
  );

  const common = { clientId, context, hints, locale, onSaved: onSectionSaved };
  const wire = (key: SectionKey) => ({
    open: openSection === key,
    onToggle: () => handleToggle(key),
    onDirtyChange: (d: boolean) => setDirty(key, d),
  });

  return (
    <div className="flex flex-col gap-3">
      <PersonalDataSection {...common} {...wire('personal')} data={data.personal} />
      <ContactSection {...common} {...wire('contact')} data={data.contact} />
      <BillingSection {...common} {...wire('billing')} data={data.billing} />
    </div>
  );
}

// ── SectionShell (used by all section components via `import { SectionShell } from './details-tab'`).

export type SectionShellProps = {
  title: string;
  open: boolean;
  onToggle: () => void;
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  saving: boolean;
  canEdit?: boolean;
  hints: DetailsTabHints;
  previewText: string;
  readMode: ReactNode;
  editMode: ReactNode;
};

export function SectionShell({
  title,
  open,
  onToggle,
  editing,
  onStartEdit,
  onCancelEdit,
  onSave,
  saving,
  canEdit = true,
  hints,
  previewText,
  readMode,
  editMode,
}: SectionShellProps) {
  return (
    <Card size="sm">
      <CardHeader
        className="flex cursor-pointer flex-row items-center justify-between gap-2"
        onClick={onToggle}
      >
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <span className="font-medium">{title}</span>
          {!open && (
            <span className="truncate text-xs text-muted-foreground">{previewText}</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </CardHeader>
      {open && (
        <CardContent className="flex flex-col gap-4 border-t pt-4">
          {!editing ? (
            <>
              {readMode}
              {canEdit && (
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={onStartEdit}>
                    <Pencil className="mr-1.5 size-3.5" />
                    {hints.section.editLabel}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              {editMode}
              <div className="flex justify-end gap-2 border-t pt-3">
                <Button variant="ghost" size="sm" onClick={onCancelEdit} disabled={saving}>
                  {hints.section.cancelLabel}
                </Button>
                <Button size="sm" onClick={onSave} disabled={saving}>
                  {hints.section.saveLabel}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function Field({
  label,
  value,
  fallback,
}: {
  label: string;
  value: string | null;
  fallback: string;
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm whitespace-pre-wrap">{value || fallback}</dd>
    </div>
  );
}
