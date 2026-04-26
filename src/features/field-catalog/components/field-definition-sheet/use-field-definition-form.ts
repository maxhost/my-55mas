'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type {
  InputType,
  PersistenceType,
  PersistenceTarget,
} from '@/shared/lib/field-catalog/types';
import { saveFieldDefinition } from '../../actions/save-field-definition';
import {
  CATALOG_LOCALES,
  type FieldDefinitionInput,
  type FieldDefinitionWithTranslations,
  type FieldTranslationEntry,
  type FieldTranslations,
} from '../../types';
import { mapFieldDefinitionErrorKey } from './errors';

const emptyTrEntry: FieldTranslationEntry = {
  label: '',
  placeholder: '',
  description: '',
  option_labels: null,
};

export function emptyTranslations(): FieldTranslations {
  return CATALOG_LOCALES.reduce(
    (acc, l) => ({ ...acc, [l]: { ...emptyTrEntry } }),
    {} as FieldTranslations
  );
}

export function defaultTarget(type: PersistenceType): PersistenceTarget {
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

type UseFormInput = {
  open: boolean;
  groupId: string;
  field: FieldDefinitionWithTranslations | null;
  onSaved: () => void;
};

// Encapsula todo el state + init + handlers + submit del sheet.
// Mantiene el sheet component focalizado en el JSX.
export function useFieldDefinitionForm(input: UseFormInput) {
  const { open, groupId, field, onSaved } = input;
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
  const [allowChange, setAllowChange] = useState(false);
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
      allow_change?: boolean;
    };
    setTosUrl(typeof cfg.tos_url === 'string' ? cfg.tos_url : '');
    setPrivacyUrl(typeof cfg.privacy_url === 'string' ? cfg.privacy_url : '');
    setAllowChange(cfg.allow_change === true);
    setSortOrder(field?.sort_order ?? 0);
    setIsActive(field?.is_active ?? true);
    setTranslations(field?.translations ?? emptyTranslations());
  }, [open, field]);

  const handlePersistenceTypeChange = (next: PersistenceType) => {
    setPersistenceType(next);
    setTarget(defaultTarget(next));
    // allow_change solo aplica a email+auth — reset en cualquier cambio que
    // rompa esa combinación para evitar state stale y errores de Zod.
    if (!(inputType === 'email' && next === 'auth')) setAllowChange(false);
  };

  const handleInputTypeChange = (next: InputType) => {
    setInputType(next);
    // display_text presentacional → forzamos persistence='none'.
    if (next === 'display_text') {
      setPersistenceType('none');
      setTarget(null);
    } else if (next === 'terms_checkbox') {
      // terms_checkbox persiste boolean; default form_response.
      if (persistenceType === 'none') {
        setPersistenceType('form_response');
        setTarget(null);
      }
    } else if (persistenceType === 'none') {
      // Venían de display_text → reset a persistence sensato.
      setPersistenceType('form_response');
      setTarget(null);
    }
    // allow_change solo aplica a email+auth.
    if (!(next === 'email' && persistenceType === 'auth')) setAllowChange(false);
  };

  const parseOptions = (): string[] | null => {
    const trimmed = optionsText.trim();
    if (!trimmed) return null;
    return trimmed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const buildConfig = (): Record<string, unknown> | null => {
    const cfg: Record<string, unknown> = {};
    if (inputType === 'terms_checkbox') {
      if (tosUrl.trim()) cfg.tos_url = tosUrl.trim();
      if (privacyUrl.trim()) cfg.privacy_url = privacyUrl.trim();
    }
    // Sólo persistimos allow_change=true para email+auth. Si el admin
    // cambia a otra combinación, allowChange ya fue reseteado en los
    // handlers, así que esto actúa como defensa de última línea.
    if (inputType === 'email' && persistenceType === 'auth' && allowChange) {
      cfg.allow_change = true;
    }
    return Object.keys(cfg).length > 0 ? cfg : null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = {
      id: field?.id ?? null,
      group_id: groupId,
      key,
      input_type: inputType,
      persistence_type: persistenceType,
      persistence_target: target,
      options: parseOptions(),
      options_source: null,
      config: buildConfig(),
      sort_order: sortOrder,
      is_active: isActive,
      translations,
    } as FieldDefinitionInput;

    startTransition(async () => {
      const result = await saveFieldDefinition(payload);
      if (!result.ok) {
        const errKey = mapFieldDefinitionErrorKey(result.error);
        setError(result.error);
        toast.error(t(`errors.${errKey}`));
        console.error('[FieldDefinitionSheet] saveFieldDefinition error:', result.error);
        return;
      }
      toast.success(t('savedSuccess'));
      onSaved();
      router.refresh();
    });
  };

  return {
    state: {
      key,
      inputType,
      persistenceType,
      target,
      optionsText,
      tosUrl,
      privacyUrl,
      allowChange,
      sortOrder,
      isActive,
      translations,
      isPending,
      error,
    },
    setters: {
      setKey,
      setTarget,
      setOptionsText,
      setTosUrl,
      setPrivacyUrl,
      setAllowChange,
      setSortOrder,
      setIsActive,
      setTranslations,
    },
    handlers: {
      handlePersistenceTypeChange,
      handleInputTypeChange,
      handleSubmit,
    },
  };
}
