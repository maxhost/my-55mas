'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { locales } from '@/lib/i18n/config';
import type { FormI18n, FormI18nFieldEntry, FormI18nLocaleEntry, FormSchema } from '../types';
import { FieldI18nCard } from './field-i18n-card';

type Props = {
  schema: FormSchema;
  i18n: FormI18n;
  onChange: (i18n: FormI18n) => void;
};

export function I18nTab({ schema, i18n, onChange }: Props) {
  const t = useTranslations('AdminFormDefinitions');
  const primaryLocale = locales[0];

  const updateLocale = (locale: string, entry: FormI18nLocaleEntry) => {
    onChange({ ...i18n, [locale]: entry });
  };

  return (
    <Tabs defaultValue={primaryLocale}>
      <TabsList>
        {locales.map((locale) => (
          <TabsTrigger key={locale} value={locale}>
            {locale.toUpperCase()}
          </TabsTrigger>
        ))}
      </TabsList>

      {locales.map((locale) => {
        const entry: FormI18nLocaleEntry = i18n[locale] ?? {};
        const fields = entry.fields ?? {};

        return (
          <TabsContent key={locale} value={locale} className="space-y-4 pt-3">
            <div className="space-y-3 rounded-md border bg-card p-4">
              <FieldRow label={t('titleField')}>
                <Input
                  value={entry.title ?? ''}
                  onChange={(e) => updateLocale(locale, { ...entry, title: e.target.value })}
                  className="h-8 text-sm"
                />
              </FieldRow>
              <FieldRow label={t('submitLabelField')}>
                <Input
                  value={entry.submitLabel ?? ''}
                  onChange={(e) =>
                    updateLocale(locale, { ...entry, submitLabel: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </FieldRow>
            </div>

            <div className="space-y-2">
              {schema.fields.length === 0 && (
                <p className="text-muted-foreground py-4 text-sm italic">{t('noFields')}</p>
              )}
              {schema.fields.map((field) => {
                const fieldEntry: FormI18nFieldEntry = fields[field.key] ?? {};
                return (
                  <FieldI18nCard
                    key={field.key}
                    field={field}
                    entry={fieldEntry}
                    onChange={(updated) =>
                      updateLocale(locale, {
                        ...entry,
                        fields: { ...fields, [field.key]: updated },
                      })
                    }
                  />
                );
              })}
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
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
