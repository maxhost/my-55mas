'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { locales } from '@/lib/i18n/config';
import { saveTranslation } from '../actions/update-service';
import type { ServiceTranslationDetail, FaqItem } from '../types';
import { ListEditor } from './list-editor';
import { FaqEditor } from './faq-editor';

type Props = {
  serviceId: string;
  translations: ServiceTranslationDetail[];
};

type LocaleData = {
  name: string;
  description: string;
  includes: string;
  hero_title: string;
  hero_subtitle: string;
  benefits: string[];
  guarantees: string[];
  faqs: FaqItem[];
};

function emptyLocaleData(): LocaleData {
  return {
    name: '',
    description: '',
    includes: '',
    hero_title: '',
    hero_subtitle: '',
    benefits: [],
    guarantees: [],
    faqs: [],
  };
}

function translationToData(t: ServiceTranslationDetail): LocaleData {
  return {
    name: t.name,
    description: t.description ?? '',
    includes: t.includes ?? '',
    hero_title: t.hero_title ?? '',
    hero_subtitle: t.hero_subtitle ?? '',
    benefits: t.benefits,
    guarantees: t.guarantees,
    faqs: t.faqs,
  };
}

export function ServiceForm({ serviceId, translations }: Props) {
  const t = useTranslations('AdminServices');
  const [isPending, startTransition] = useTransition();

  const initialData: Record<string, LocaleData> = {};
  for (const locale of locales) {
    const existing = translations.find((tr) => tr.locale === locale);
    initialData[locale] = existing
      ? translationToData(existing)
      : emptyLocaleData();
  }

  const [data, setData] = useState(initialData);
  const [activeLocale, setActiveLocale] = useState<string>(locales[0]);

  const updateField = (field: keyof LocaleData, value: LocaleData[keyof LocaleData]) => {
    setData((prev) => ({
      ...prev,
      [activeLocale]: { ...prev[activeLocale], [field]: value },
    }));
  };

  const handleSave = () => {
    const localeData = data[activeLocale];
    startTransition(async () => {
      await saveTranslation({
        service_id: serviceId,
        translation: { locale: activeLocale, ...localeData },
      });
    });
  };

  const current = data[activeLocale];

  return (
    <div className="space-y-6">
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
            <div className="space-y-2">
              <Label>{t('name')} *</Label>
              <Input
                value={current.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('description')}</Label>
              <Textarea
                value={current.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('includes')}</Label>
              <Textarea
                value={current.includes}
                onChange={(e) => updateField('includes', e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('heroTitle')}</Label>
                <Input
                  value={current.hero_title}
                  onChange={(e) => updateField('hero_title', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('heroSubtitle')}</Label>
                <Input
                  value={current.hero_subtitle}
                  onChange={(e) =>
                    updateField('hero_subtitle', e.target.value)
                  }
                />
              </div>
            </div>
            <ListEditor
              label={t('benefits')}
              items={current.benefits}
              onChange={(items) => updateField('benefits', items)}
            />
            <ListEditor
              label={t('guarantees')}
              items={current.guarantees}
              onChange={(items) => updateField('guarantees', items)}
            />
            <FaqEditor
              faqs={current.faqs}
              onChange={(faqs) => updateField('faqs', faqs)}
            />
          </TabsContent>
        ))}
      </Tabs>
      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? t('saving') : t('save')}
      </Button>
    </div>
  );
}
