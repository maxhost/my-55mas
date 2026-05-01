'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { FormFieldDefinition, FormI18nFieldEntry } from '../types';

type Props = {
  field: FormFieldDefinition;
  entry: FormI18nFieldEntry;
  onChange: (entry: FormI18nFieldEntry) => void;
};

export function FieldI18nCard({ field, entry, onChange }: Props) {
  const t = useTranslations('AdminFormDefinitions');
  const [isOpen, setIsOpen] = useState(false);

  const errorKeys = Object.keys(entry.errors ?? {});

  const updateError = (key: string, value: string) => {
    onChange({
      ...entry,
      errors: { ...(entry.errors ?? {}), [key]: value },
    });
  };

  return (
    <div className="rounded-md border">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-muted/50 flex w-full items-center gap-2 p-3 text-left text-sm"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span className="font-mono text-xs">{field.key}</span>
        <span className="text-muted-foreground text-xs">({field.type})</span>
        {field.required && (
          <span className="rounded bg-red-100 px-1 text-[10px] text-red-700">*</span>
        )}
        <span className="text-muted-foreground ml-auto truncate text-xs italic">
          {entry.label || t('noLabel')}
        </span>
      </button>

      {isOpen && (
        <div className="space-y-3 border-t p-3">
          <FieldRow label={t('fieldLabel')}>
            <Input
              value={entry.label ?? ''}
              onChange={(e) => onChange({ ...entry, label: e.target.value })}
              className="h-8 text-sm"
            />
          </FieldRow>
          <FieldRow label={t('fieldPlaceholder')}>
            <Input
              value={entry.placeholder ?? ''}
              onChange={(e) => onChange({ ...entry, placeholder: e.target.value })}
              className="h-8 text-sm"
            />
          </FieldRow>
          <FieldRow label={t('fieldHelp')}>
            <Input
              value={entry.help ?? ''}
              onChange={(e) => onChange({ ...entry, help: e.target.value })}
              className="h-8 text-sm"
            />
          </FieldRow>

          {errorKeys.length > 0 && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium">{t('fieldErrors')}</p>
              {errorKeys.map((key) => (
                <FieldRow key={key} label={key}>
                  <Input
                    value={entry.errors?.[key] ?? ''}
                    onChange={(e) => updateError(key, e.target.value)}
                    className="h-8 text-sm"
                  />
                </FieldRow>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-2">
      <label className="text-muted-foreground text-xs">{label}</label>
      {children}
    </div>
  );
}
