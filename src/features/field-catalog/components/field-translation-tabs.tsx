'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CATALOG_LOCALES,
  type CatalogLocale,
  type FieldTranslationEntry,
  type FieldTranslations,
} from '../types';

type Props = {
  translations: FieldTranslations;
  onChange: (next: FieldTranslations) => void;
};

export function FieldTranslationTabs({ translations, onChange }: Props) {
  const t = useTranslations('AdminFieldCatalog');

  const setField = (
    locale: CatalogLocale,
    key: keyof FieldTranslationEntry,
    value: string
  ) => {
    onChange({
      ...translations,
      [locale]: { ...translations[locale], [key]: value },
    });
  };

  return (
    <div className="space-y-2">
      <Label>{t('translations')}</Label>
      <Tabs defaultValue="es">
        <TabsList>
          {CATALOG_LOCALES.map((l) => (
            <TabsTrigger key={l} value={l}>
              {l.toUpperCase()}
            </TabsTrigger>
          ))}
        </TabsList>
        {CATALOG_LOCALES.map((l) => (
          <TabsContent key={l} value={l} className="space-y-2 pt-2">
            <Input
              value={translations[l].label}
              onChange={(e) => setField(l, 'label', e.target.value)}
              placeholder={t('label')}
            />
            <Input
              value={translations[l].placeholder}
              onChange={(e) => setField(l, 'placeholder', e.target.value)}
              placeholder={t('placeholder')}
            />
            <Input
              value={translations[l].description}
              onChange={(e) => setField(l, 'description', e.target.value)}
              placeholder={t('descriptionLabel')}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
