'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { locales } from '@/lib/i18n/config';
import { saveSpokenLanguage } from '../actions/save-spoken-language';
import { deleteSpokenLanguage } from '../actions/delete-spoken-language';
import type {
  SaveSpokenLanguageResult,
  SpokenLanguageInput,
  SpokenLanguageLocale,
  SpokenLanguageTranslations,
  SpokenLanguageWithTranslations,
} from '../types';
import { SPOKEN_LANGUAGE_LOCALES } from '../types';
import { SpokenLanguageRow } from './spoken-language-row';

type Props = {
  initialLanguages: SpokenLanguageWithTranslations[];
};

const primaryLocale: SpokenLanguageLocale = 'es';

function emptyTranslations(): SpokenLanguageTranslations {
  return SPOKEN_LANGUAGE_LOCALES.reduce((acc, locale) => {
    acc[locale] = '';
    return acc;
  }, {} as SpokenLanguageTranslations);
}

function toInput(lang: SpokenLanguageWithTranslations): SpokenLanguageInput {
  return {
    code: lang.code,
    sort_order: lang.sort_order,
    is_active: lang.is_active,
    translations: { ...emptyTranslations(), ...lang.translations },
    creating: false,
  };
}

const I18N_ERROR_KEYS = new Set([
  'duplicateCode',
  'invalidCode',
  'missingTranslation',
  'saveFailed',
]);

function extractErrorKey(
  result: Extract<SaveSpokenLanguageResult, { error: Record<string, string[]> }>
): string {
  const firstMsg = Object.values(result.error).flat().find(Boolean);
  if (firstMsg && I18N_ERROR_KEYS.has(firstMsg)) return firstMsg;
  return 'saveFailed';
}

export function SpokenLanguagesEditor({ initialLanguages }: Props) {
  const t = useTranslations('AdminSpokenLanguages');
  const tc = useTranslations('Common');
  const [isPending, startTransition] = useTransition();
  const [languages, setLanguages] = useState<SpokenLanguageInput[]>(
    initialLanguages.map(toInput)
  );
  const [removedCodes, setRemovedCodes] = useState<string[]>([]);

  const addLanguage = () => {
    setLanguages([
      ...languages,
      {
        code: '',
        sort_order: languages.length,
        is_active: true,
        translations: emptyTranslations(),
        creating: true,
      },
    ]);
  };

  const updateLanguage = (index: number, lang: SpokenLanguageInput) => {
    setLanguages(languages.map((l, i) => (i === index ? lang : l)));
  };

  const removeLanguage = (index: number) => {
    const lang = languages[index];
    if (!confirm(t('confirmDelete'))) return;
    if (!lang.creating && lang.code) {
      setRemovedCodes([...removedCodes, lang.code]);
    }
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const normalized = languages.map((lang, i) => ({ ...lang, sort_order: i }));

    startTransition(async () => {
      for (const code of removedCodes) {
        const result = await deleteSpokenLanguage(code);
        if ('error' in result) {
          toast.error(t('errors.saveFailed'));
          return;
        }
      }

      for (const lang of normalized) {
        const result = await saveSpokenLanguage({ language: lang });
        if ('error' in result) {
          toast.error(t(`errors.${extractErrorKey(result)}`));
          return;
        }
      }

      toast.success(tc('savedSuccess'));
      setLanguages(normalized.map((lang) => ({ ...lang, creating: false })));
      setRemovedCodes([]);
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{t('description')}</p>

      <Tabs defaultValue={primaryLocale}>
        <TabsList>
          {locales.map((locale) => (
            <TabsTrigger key={locale} value={locale}>
              {locale.toUpperCase()}
            </TabsTrigger>
          ))}
        </TabsList>

        {locales.map((locale) => (
          <TabsContent key={locale} value={locale} className="space-y-2 pt-3">
            {languages.length === 0 && (
              <p className="text-muted-foreground py-4 text-sm">{t('noLanguages')}</p>
            )}

            {languages.map((lang, index) => (
              <SpokenLanguageRow
                key={lang.creating ? `new-${index}` : lang.code}
                language={lang}
                locale={locale as SpokenLanguageLocale}
                isPrimary={locale === primaryLocale}
                onChange={(l) => updateLanguage(index, l)}
                onRemove={() => removeLanguage(index)}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={addLanguage}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addLanguage')}
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? t('saving') : t('save')}
        </Button>
      </div>
    </div>
  );
}
