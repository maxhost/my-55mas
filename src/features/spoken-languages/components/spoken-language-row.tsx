'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { SpokenLanguageInput, SpokenLanguageLocale } from '../types';

type Props = {
  language: SpokenLanguageInput;
  locale: SpokenLanguageLocale;
  isPrimary: boolean;
  onChange: (language: SpokenLanguageInput) => void;
  onRemove: () => void;
};

export function SpokenLanguageRow({
  language,
  locale,
  isPrimary,
  onChange,
  onRemove,
}: Props) {
  const t = useTranslations('AdminSpokenLanguages');

  return (
    <div className="flex items-center gap-2">
      {isPrimary &&
        (language.creating ? (
          <Input
            value={language.code}
            onChange={(e) =>
              onChange({ ...language, code: e.target.value.toLowerCase().trim() })
            }
            placeholder={t('code')}
            className="h-8 w-24 font-mono text-sm"
            aria-label={t('code')}
          />
        ) : (
          <span
            className="inline-flex h-8 w-24 items-center rounded-md border border-dashed border-muted bg-muted/30 px-2 font-mono text-sm text-muted-foreground"
            title={t('codeReadonlyHint')}
          >
            {language.code}
          </span>
        ))}

      <Input
        value={language.translations[locale] ?? ''}
        onChange={(e) =>
          onChange({
            ...language,
            translations: { ...language.translations, [locale]: e.target.value },
          })
        }
        placeholder={t('translationPlaceholder')}
        className="h-8 flex-1 text-sm"
      />

      {isPrimary && (
        <>
          <label className="flex items-center gap-1 text-xs whitespace-nowrap">
            <input
              type="checkbox"
              checked={language.is_active}
              onChange={(e) =>
                onChange({ ...language, is_active: e.target.checked })
              }
              className="h-3 w-3"
            />
            {t('active')}
          </label>
          <Button type="button" variant="ghost" size="icon-xs" onClick={onRemove}>
            <X />
          </Button>
        </>
      )}
    </div>
  );
}
