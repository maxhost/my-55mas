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
import {
  dbColumnHasAutoOptions,
  getStaticDbColumnOptions,
} from '@/shared/lib/field-catalog/db-column-options';
import { getColumnDef } from '@/shared/lib/forms/db-column-registry';
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
  const [tosUrl, setTosUrl] = useState('');
  const [privacyUrl, setPrivacyUrl] = useState('');
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
    const cfg = (field?.config ?? {}) as {
      tos_url?: string;
      privacy_url?: string;
    };
    setTosUrl(typeof cfg.tos_url === 'string' ? cfg.tos_url : '');
    setPrivacyUrl(typeof cfg.privacy_url === 'string' ? cfg.privacy_url : '');
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
    } else if (next === 'terms_checkbox') {
      // terms_checkbox persiste un boolean; default sensato es form_response.
      if (persistenceType === 'none') {
        setPersistenceType('form_response');
        setTarget(null);
      }
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
    // config se persiste solo si el input_type lo usa (terms_checkbox).
    let config: Record<string, unknown> | null = null;
    if (inputType === 'terms_checkbox') {
      const cfg: Record<string, unknown> = {};
      if (tosUrl.trim()) cfg.tos_url = tosUrl.trim();
      if (privacyUrl.trim()) cfg.privacy_url = privacyUrl.trim();
      config = cfg;
    }

    const input = {
      id: field?.id ?? null,
      group_id: groupId,
      key,
      input_type: inputType,
      persistence_type: persistenceType,
      persistence_target: target,
      options: parseOptions(),
      options_source: null,
      config,
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
  // service_select las trae del catálogo de servicios. db_column con registry
  // column que tiene options/optionsSource también es auto.
  const isDynamicOptions =
    persistenceType === 'subtype' || persistenceType === 'service_select';
  const dbColumnTarget =
    persistenceType === 'db_column'
      ? (target as { table?: string; column?: string } | null)
      : null;
  const registryAutoOptions =
    !!(dbColumnTarget?.table && dbColumnTarget?.column) &&
    dbColumnHasAutoOptions({
      table: dbColumnTarget.table,
      column: dbColumnTarget.column,
    });
  const takesOptions =
    inputType === 'single_select' ||
    inputType === 'multiselect_checkbox' ||
    inputType === 'multiselect_dropdown';
  const hasOptions =
    takesOptions && !isDynamicOptions && !registryAutoOptions;

  // Preview de las opciones del registry (solo si son estáticas).
  const registryPreviewOptions =
    registryAutoOptions && dbColumnTarget?.table && dbColumnTarget?.column
      ? getStaticDbColumnOptions({
          table: dbColumnTarget.table,
          column: dbColumnTarget.column,
        })
      : null;
  const registryPreviewSource =
    registryAutoOptions && dbColumnTarget?.table && dbColumnTarget?.column
      ? getColumnDef(dbColumnTarget.table, dbColumnTarget.column)?.optionsSource
      : undefined;

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

          {takesOptions && registryAutoOptions && (
            <div className="rounded-md border border-dashed p-3 text-xs">
              <p className="text-muted-foreground mb-1 font-medium">
                {t('optionsFromRegistry')}
              </p>
              {registryPreviewOptions ? (
                <div className="flex flex-wrap gap-1">
                  {registryPreviewOptions.map((opt) => (
                    <span
                      key={opt}
                      className="bg-muted rounded px-1.5 py-0.5 font-mono"
                    >
                      {opt}
                    </span>
                  ))}
                </div>
              ) : registryPreviewSource ? (
                <p className="text-muted-foreground">
                  {t('optionsFromSource', { source: registryPreviewSource })}
                </p>
              ) : null}
            </div>
          )}

          {inputType === 'terms_checkbox' && (
            <div className="space-y-3 rounded-md border border-dashed p-3">
              <p className="text-muted-foreground text-xs">
                {t('termsConfigHint')}
              </p>
              <div className="space-y-2">
                <Label>{t('termsTosUrl')}</Label>
                <Input
                  type="url"
                  value={tosUrl}
                  onChange={(e) => setTosUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>{t('termsPrivacyUrl')}</Label>
                <Input
                  type="url"
                  value={privacyUrl}
                  onChange={(e) => setPrivacyUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          )}

          <FieldTranslationTabs
            translations={translations}
            onChange={setTranslations}
            isDisplayText={inputType === 'display_text'}
            isTermsCheckbox={inputType === 'terms_checkbox'}
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
  if (error.includes('missingTermsUrls')) return 'missingTermsUrls';
  if (error.includes('invalidUrl')) return 'invalidUrl';
  if (error.includes('missingLabel') || error.includes('translations'))
    return 'missingLabel';
  return 'saveFailed';
}
