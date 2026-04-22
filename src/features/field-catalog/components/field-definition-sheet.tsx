'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  INPUT_TYPES,
  PERSISTENCE_TYPES,
  type InputType,
  type PersistenceType,
  type PersistenceTarget,
} from '@/shared/lib/field-catalog/types';
import { saveFieldDefinition } from '../actions/save-field-definition';
import {
  CATALOG_LOCALES,
  type FieldDefinitionInput,
  type FieldDefinitionWithTranslations,
  type FieldTranslationEntry,
  type FieldTranslations,
} from '../types';
import { PersistenceTargetFields } from './persistence-target-fields';
import { FieldTranslationTabs } from './field-translation-tabs';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  field: FieldDefinitionWithTranslations | null;
};

const emptyTrEntry: FieldTranslationEntry = {
  label: '',
  placeholder: '',
  description: '',
  option_labels: null,
};

function emptyTranslations(): FieldTranslations {
  return CATALOG_LOCALES.reduce(
    (acc, l) => ({ ...acc, [l]: { ...emptyTrEntry } }),
    {} as FieldTranslations
  );
}

function defaultTarget(type: PersistenceType): PersistenceTarget {
  switch (type) {
    case 'db_column':
      return { table: 'profiles', column: '' };
    case 'auth':
      return { auth_field: 'email' };
    case 'survey':
      return { survey_question_key: '' };
    case 'subtype':
      return { subtype_group: '' };
    default:
      return null;
  }
}

export function FieldDefinitionSheet({
  open,
  onOpenChange,
  groupId,
  field,
}: Props) {
  const t = useTranslations('AdminFieldCatalog');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [key, setKey] = useState('');
  const [inputType, setInputType] = useState<InputType>('text');
  const [persistenceType, setPersistenceType] =
    useState<PersistenceType>('form_response');
  const [target, setTarget] = useState<PersistenceTarget>(null);
  const [optionsText, setOptionsText] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [translations, setTranslations] = useState<FieldTranslations>(
    emptyTranslations()
  );

  useEffect(() => {
    if (!open) return;
    setKey(field?.key ?? '');
    setInputType((field?.input_type ?? 'text') as InputType);
    const pt = (field?.persistence_type ?? 'form_response') as PersistenceType;
    setPersistenceType(pt);
    setTarget(field?.persistence_target ?? defaultTarget(pt));
    setOptionsText(field?.options?.join(', ') ?? '');
    setSortOrder(field?.sort_order ?? 0);
    setIsActive(field?.is_active ?? true);
    setTranslations(field?.translations ?? emptyTranslations());
  }, [open, field]);

  const handlePersistenceTypeChange = (next: PersistenceType) => {
    setPersistenceType(next);
    setTarget(defaultTarget(next));
  };

  const parseOptions = (): string[] | null => {
    const trimmed = optionsText.trim();
    if (!trimmed) return null;
    return trimmed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const handleSave = () => {
    const input = {
      id: field?.id ?? null,
      group_id: groupId,
      key,
      input_type: inputType,
      persistence_type: persistenceType,
      persistence_target: target,
      options: parseOptions(),
      options_source: null,
      sort_order: sortOrder,
      is_active: isActive,
      translations,
    } as FieldDefinitionInput;

    startTransition(async () => {
      const result = await saveFieldDefinition(input);
      if (!result.ok) {
        const key = mapErrorKey(result.error);
        toast.error(t(`errors.${key}`));
        return;
      }
      toast.success(t('savedSuccess'));
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{field ? t('editField') : t('addField')}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('key')}</Label>
              <Input value={key} onChange={(e) => setKey(e.target.value)} />
              <p className="text-muted-foreground text-xs">{t('keyHint')}</p>
            </div>
            <div className="space-y-1.5">
              <Label>{t('sortOrder')}</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('inputType')}</Label>
              <Select
                value={inputType}
                onValueChange={(v) => {
                  if (v == null) return;
                  setInputType(v as InputType);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INPUT_TYPES.map((it) => (
                    <SelectItem key={it} value={it}>
                      {it}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('persistenceType')}</Label>
              <Select
                value={persistenceType}
                onValueChange={(v) => {
                  if (v == null) return;
                  handlePersistenceTypeChange(v as PersistenceType);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERSISTENCE_TYPES.map((pt) => (
                    <SelectItem key={pt} value={pt}>
                      {pt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <PersistenceTargetFields
            persistenceType={persistenceType}
            target={target}
            onChange={setTarget}
          />

          {(inputType === 'single_select' || inputType === 'multiselect') && (
            <div className="space-y-1.5">
              <Label>Options</Label>
              <Input
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder="a, b, c"
              />
              <p className="text-muted-foreground text-xs">{t('optionsHint')}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id="field-active"
              checked={isActive}
              onCheckedChange={(v) => setIsActive(v === true)}
            />
            <Label htmlFor="field-active">{t('active')}</Label>
          </div>

          <FieldTranslationTabs
            translations={translations}
            onChange={setTranslations}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? t('saving') : t('save')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function mapErrorKey(error: string): string {
  if (error === 'duplicateKey') return 'duplicateKey';
  if (error === 'groupNotFound') return 'groupNotFound';
  if (error === 'invalidKey') return 'invalidKey';
  if (error.includes('missingLabel')) return 'missingLabel';
  if (error.includes('missingTranslation')) return 'missingTranslation';
  return 'saveFailed';
}
