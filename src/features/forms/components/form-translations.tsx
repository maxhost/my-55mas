'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { locales } from '@/lib/i18n/config';
import { saveFormTranslations } from '../actions/save-form';
import type {
  FormSchema,
  FormTranslationData,
  FormField,
} from '../types';
import { FIELD_TYPES_WITH_OPTIONS } from '../types';

type Props = {
  formId: string;
  schema: FormSchema;
  translations: Record<string, FormTranslationData>;
};

function emptyTranslation(): FormTranslationData {
  return { labels: {}, placeholders: {}, option_labels: {} };
}

export function FormTranslations({ formId, schema, translations }: Props) {
  const t = useTranslations('AdminFormBuilder');
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<Record<string, FormTranslationData>>(() => {
    const init: Record<string, FormTranslationData> = {};
    for (const locale of locales) {
      init[locale] = translations[locale] ?? emptyTranslation();
    }
    return init;
  });
  const [activeLocale, setActiveLocale] = useState<string>(locales[0]);

  const current = data[activeLocale];

  const setLabel = (key: string, value: string) => {
    setData((prev) => ({
      ...prev,
      [activeLocale]: {
        ...prev[activeLocale],
        labels: { ...prev[activeLocale].labels, [key]: value },
      },
    }));
  };

  const setPlaceholder = (key: string, value: string) => {
    setData((prev) => ({
      ...prev,
      [activeLocale]: {
        ...prev[activeLocale],
        placeholders: { ...prev[activeLocale].placeholders, [key]: value },
      },
    }));
  };

  const setOptionLabel = (compositeKey: string, value: string) => {
    setData((prev) => ({
      ...prev,
      [activeLocale]: {
        ...prev[activeLocale],
        option_labels: {
          ...prev[activeLocale].option_labels,
          [compositeKey]: value,
        },
      },
    }));
  };

  const handleSave = () => {
    const localeData = current;
    startTransition(async () => {
      await saveFormTranslations({
        form_id: formId,
        locale: activeLocale,
        ...localeData,
      });
    });
  };

  const renderField = (field: FormField) => {
    const hasOptions = FIELD_TYPES_WITH_OPTIONS.includes(field.type);
    return (
      <div key={field.key} className="space-y-1 pl-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">{t('label')}: {field.key}</Label>
            <Input
              value={current.labels[field.key] ?? ''}
              onChange={(e) => setLabel(field.key, e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">{t('placeholder')}</Label>
            <Input
              value={current.placeholders[field.key] ?? ''}
              onChange={(e) => setPlaceholder(field.key, e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
        {hasOptions && field.options && (
          <div className="space-y-1 pl-4">
            {field.options.map((opt) => {
              const compositeKey = `${field.key}.${opt}`;
              return (
                <div key={compositeKey} className="flex items-center gap-2">
                  <span className="text-muted-foreground w-24 text-xs">
                    {opt}:
                  </span>
                  <Input
                    value={current.option_labels[compositeKey] ?? ''}
                    onChange={(e) =>
                      setOptionLabel(compositeKey, e.target.value)
                    }
                    className="h-7 text-xs"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{t('translations')}</h3>
      <Tabs value={activeLocale} onValueChange={setActiveLocale}>
        <TabsList>
          {locales.map((locale) => (
            <TabsTrigger key={locale} value={locale}>
              {locale.toUpperCase()}
            </TabsTrigger>
          ))}
        </TabsList>

        {locales.map((locale) => (
          <TabsContent key={locale} value={locale} className="space-y-4 pt-4">
            {schema.steps.map((step) => (
              <div key={step.key} className="space-y-2">
                <div className="border-border border-b pb-1">
                  <Label className="text-xs">{t('label')}: {step.key}</Label>
                  <Input
                    value={current.labels[step.key] ?? ''}
                    onChange={(e) => setLabel(step.key, e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                {step.fields.map(renderField)}
              </div>
            ))}
          </TabsContent>
        ))}
      </Tabs>
      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? t('saving') : t('save')}
      </Button>
    </div>
  );
}
