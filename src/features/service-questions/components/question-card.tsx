'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronRight, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { locales } from '@/lib/i18n/config';
import { QUESTION_TYPES, DEFAULT_FILE_CONFIG, type AssignedSubtypeGroup, type Question, type QuestionType } from '../types';
import { ManualOptionsEditor } from './manual-options-editor';
import { SubtypeSourceEditor } from './subtype-source-editor';
import { FileConfigEditor } from './file-config-editor';

type Props = {
  question: Question;
  index: number;
  total: number;
  assignedGroups: AssignedSubtypeGroup[];
  locale: string;
  onChange: (q: Question) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export function QuestionCard({
  question,
  index,
  total,
  assignedGroups,
  locale,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: Props) {
  const t = useTranslations('AdminServiceQuestions');
  const [open, setOpen] = useState(false);

  const isSelect = question.type === 'singleSelect' || question.type === 'multiSelect';
  const isFile = question.type === 'file';

  const handleTypeChange = (newType: QuestionType) => {
    const next: Question = { ...question, type: newType };
    if (newType === 'singleSelect' || newType === 'multiSelect') {
      next.optionsSource = next.optionsSource ?? 'manual';
      next.options = next.options ?? [];
    } else {
      next.optionsSource = undefined;
      next.options = undefined;
      next.subtypeGroupSlug = undefined;
      next.subtypeExcludedIds = undefined;
    }
    if (newType === 'file') {
      next.fileConfig = next.fileConfig ?? DEFAULT_FILE_CONFIG;
    } else {
      next.fileConfig = undefined;
    }
    onChange(next);
  };

  const updateI18n = (loc: string, field: 'label' | 'placeholder' | 'help', value: string) => {
    onChange({
      ...question,
      i18n: { ...question.i18n, [loc]: { ...question.i18n[loc], [field]: value } },
    });
  };

  return (
    <div className="rounded-md border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="hover:bg-muted/50 flex w-full items-center gap-2 p-3 text-left text-sm"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="font-mono text-xs">{question.key || '(sin key)'}</span>
        <span className="text-muted-foreground text-xs">({question.type})</span>
        {question.required && (
          <span className="rounded bg-red-100 px-1 text-[10px] text-red-700">*</span>
        )}
        <span className="text-muted-foreground ml-auto truncate text-xs italic">
          {question.i18n[locale]?.label ?? t('noLabel')}
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t p-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onMoveUp}
              disabled={index === 0}
              aria-label="up"
            >
              <ArrowUp />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onMoveDown}
              disabled={index === total - 1}
              aria-label="down"
            >
              <ArrowDown />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onRemove}
              className="ml-auto text-destructive"
              aria-label="remove"
            >
              <Trash2 />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-muted-foreground text-xs">{t('keyField')}</label>
              <Input
                value={question.key}
                onChange={(e) => onChange({ ...question, key: e.target.value })}
                placeholder="tipo_servicio"
                className="h-8 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-muted-foreground text-xs">{t('typeField')}</label>
              <Select value={question.type} onValueChange={(v) => handleTypeChange(v as QuestionType)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue>{(v: string) => v}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((tp) => (
                    <SelectItem key={tp} value={tp}>
                      {tp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => onChange({ ...question, required: e.target.checked })}
              className="h-3 w-3"
            />
            {t('requiredField')}
          </label>

          <Tabs defaultValue={locales[0]}>
            <TabsList>
              {locales.map((loc) => (
                <TabsTrigger key={loc} value={loc}>
                  {loc.toUpperCase()}
                </TabsTrigger>
              ))}
            </TabsList>
            {locales.map((loc) => (
              <TabsContent key={loc} value={loc} className="space-y-2 pt-2">
                <Input
                  value={question.i18n[loc]?.label ?? ''}
                  onChange={(e) => updateI18n(loc, 'label', e.target.value)}
                  placeholder={t('label')}
                  className="h-8 text-sm"
                />
                <Input
                  value={question.i18n[loc]?.placeholder ?? ''}
                  onChange={(e) => updateI18n(loc, 'placeholder', e.target.value)}
                  placeholder={t('placeholder')}
                  className="h-8 text-sm"
                />
                <Input
                  value={question.i18n[loc]?.help ?? ''}
                  onChange={(e) => updateI18n(loc, 'help', e.target.value)}
                  placeholder={t('help')}
                  className="h-8 text-sm"
                />
              </TabsContent>
            ))}
          </Tabs>

          {isSelect && (
            <div className="space-y-2">
              <label className="text-muted-foreground text-xs">{t('optionsSource')}</label>
              <Select
                value={question.optionsSource ?? 'manual'}
                onValueChange={(v) =>
                  onChange({
                    ...question,
                    optionsSource: v as 'manual' | 'subtype',
                    options: v === 'manual' ? question.options ?? [] : undefined,
                    subtypeGroupSlug: v === 'subtype' ? question.subtypeGroupSlug : undefined,
                    subtypeExcludedIds: v === 'subtype' ? question.subtypeExcludedIds ?? [] : undefined,
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue>
                    {(v: string) => (v === 'subtype' ? t('sourceSubtype') : t('sourceManual'))}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">{t('sourceManual')}</SelectItem>
                  <SelectItem value="subtype">{t('sourceSubtype')}</SelectItem>
                </SelectContent>
              </Select>

              {question.optionsSource === 'manual' && (
                <ManualOptionsEditor
                  options={question.options ?? []}
                  onChange={(opts) => onChange({ ...question, options: opts })}
                />
              )}
              {question.optionsSource === 'subtype' && (
                <SubtypeSourceEditor
                  groupSlug={question.subtypeGroupSlug}
                  excludedIds={question.subtypeExcludedIds ?? []}
                  assignedGroups={assignedGroups}
                  locale={locale}
                  onGroupChange={(slug) =>
                    onChange({ ...question, subtypeGroupSlug: slug, subtypeExcludedIds: [] })
                  }
                  onExcludedChange={(ids) => onChange({ ...question, subtypeExcludedIds: ids })}
                />
              )}
            </div>
          )}

          {isFile && (
            <FileConfigEditor
              config={question.fileConfig ?? DEFAULT_FILE_CONFIG}
              onChange={(cfg) => onChange({ ...question, fileConfig: cfg })}
            />
          )}
        </div>
      )}
    </div>
  );
}
