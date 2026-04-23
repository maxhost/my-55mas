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
import type { SubtypeGroupOption } from '@/shared/lib/field-catalog/subtype-groups';
import { PersistenceTargetFields } from './persistence-target-fields';
import { FieldTranslationTabs } from './field-translation-tabs';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  field: FieldDefinitionWithTranslations | null;
  subtypeGroups: SubtypeGroupOption[];
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
  subtypeGroups,
}: Props) {
  const t = useTranslations('AdminFieldCatalog');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
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

  const handleInputTypeChange = (next: InputType) => {
    setInputType(next);
    // display_text es meramente presentacional → forzamos persistence='none'.
    // El user no puede elegir otro persistence_type para un display_text.
    if (next === 'display_text') {
      setPersistenceType('none');
      setTarget(null);
    } else if (persistenceType === 'none') {
      // Si venían de display_text y cambian a otro input_type, reseteamos
      // a un persistence sensato.
      setPersistenceType('form_response');
      setTarget(null);
    }
  };

  const parseOptions = (): string[] | null => {
    const trimmed = optionsText.trim();
    if (!trimmed) return null;
    return trimmed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
        setError(result.error);
        toast.error(t(`errors.${key}`));
        console.error('[FieldDefinitionSheet] saveFieldDefinition error:', result.error);
        return;
      }
      toast.success(t('savedSuccess'));
      onOpenChange(false);
      router.refresh();
    });
  };

  // Las opciones se editan a mano solo cuando la persistencia no las resuelve
  // dinámicamente. subtype carga sus opciones del grupo referenciado;
  // service_select las va a cargar del contexto del talent (fuera v1).
  const isDynamicOptions =
    persistenceType === 'subtype' || persistenceType === 'service_select';
  const takesOptions =
    inputType === 'single_select' ||
    inputType === 'multiselect_checkbox' ||
    inputType === 'multiselect_dropdown';
  const hasOptions = takesOptions && !isDynamicOptions;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{field ? t('editField') : t('addField')}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="space-y-2">
            <Label>{t('key')} *</Label>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="full_name"
              required
            />
            <p className="text-muted-foreground text-xs">{t('keyHint')}</p>
          </div>

          <div className="space-y-2">
            <Label>{t('inputType')}</Label>
            <Select
              value={inputType}
              onValueChange={(v) => {
                if (v == null) return;
                handleInputTypeChange(v as InputType);
              }}
            >
              <SelectTrigger className="w-full">
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

          {inputType !== 'display_text' && (
            <div className="space-y-2">
              <Label>{t('persistenceType')}</Label>
              <Select
                value={persistenceType}
                onValueChange={(v) => {
                  if (v == null) return;
                  handlePersistenceTypeChange(v as PersistenceType);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERSISTENCE_TYPES.filter((pt) => pt !== 'none').map((pt) => (
                    <SelectItem key={pt} value={pt}>
                      {pt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {inputType !== 'display_text' && (
            <PersistenceTargetFields
              persistenceType={persistenceType}
              target={target}
              onChange={setTarget}
              subtypeGroups={subtypeGroups}
            />
          )}

          {hasOptions && (
            <div className="space-y-2">
              <Label>Options</Label>
              <Input
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder="a, b, c"
              />
              <p className="text-muted-foreground text-xs">{t('optionsHint')}</p>
            </div>
          )}

          <FieldTranslationTabs
            translations={translations}
            onChange={setTranslations}
            isDisplayText={inputType === 'display_text'}
          />

          <div className="space-y-2">
            <Label>{t('sortOrder')}</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="field-active"
              checked={isActive}
              onCheckedChange={(v) => setIsActive(v === true)}
            />
            <Label htmlFor="field-active">{t('active')}</Label>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? t('saving') : t('save')}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function mapErrorKey(error: string): string {
  if (error === 'duplicateKey') return 'duplicateKey';
  if (error === 'groupNotFound') return 'groupNotFound';
  if (error.includes('invalidKey') || error.includes('key:')) return 'invalidKey';
  if (error.includes('missingContent')) return 'missingContent';
  if (error.includes('missingLabel') || error.includes('translations'))
    return 'missingLabel';
  return 'saveFailed';
}
