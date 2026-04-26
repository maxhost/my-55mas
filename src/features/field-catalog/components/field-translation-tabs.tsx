'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  // display_text usa description como contenido principal — el tab se
  // reordena (description primero, label opcional como título).
  isDisplayText?: boolean;
  // terms_checkbox usa label como template con placeholders {tos}/{privacy}
  // y option_labels { tos, privacy } para los textos de los links.
  isTermsCheckbox?: boolean;
  // email + auth + allow_change=true: el admin puede definir el texto del
  // modal de confirmación per-locale usando option_labels.modal_title y
  // option_labels.modal_body (ambos opcionales; el renderer tiene fallback
  // a textos default).
  isEmailWithChange?: boolean;
};

export function FieldTranslationTabs({
  translations,
  onChange,
  isDisplayText,
  isTermsCheckbox,
  isEmailWithChange,
}: Props) {
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

  const setOptionLabel = (
    locale: CatalogLocale,
    labelKey: string,
    value: string
  ) => {
    const current = translations[locale].option_labels ?? {};
    const next: Record<string, string> = { ...current };
    if (value) next[labelKey] = value;
    else delete next[labelKey];
    onChange({
      ...translations,
      [locale]: {
        ...translations[locale],
        option_labels: Object.keys(next).length > 0 ? next : null,
      },
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
              {l === 'es' && ' *'}
            </TabsTrigger>
          ))}
        </TabsList>
        {CATALOG_LOCALES.map((l) => (
          <TabsContent key={l} value={l} className="space-y-2 pt-2">
            {isTermsCheckbox ? (
              // Modo terms_checkbox: label es el template (con {tos}/{privacy});
              // option_labels.{tos,privacy} son los textos de cada link.
              <>
                <Textarea
                  rows={3}
                  value={translations[l].label}
                  onChange={(e) => setField(l, 'label', e.target.value)}
                  placeholder={t('termsLabelTemplate')}
                  required={l === 'es'}
                />
                <p className="text-muted-foreground text-xs">
                  {t('termsTemplateHint')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={translations[l].option_labels?.tos ?? ''}
                    onChange={(e) => setOptionLabel(l, 'tos', e.target.value)}
                    placeholder={t('termsTosLinkText')}
                  />
                  <Input
                    value={translations[l].option_labels?.privacy ?? ''}
                    onChange={(e) => setOptionLabel(l, 'privacy', e.target.value)}
                    placeholder={t('termsPrivacyLinkText')}
                  />
                </div>
              </>
            ) : isDisplayText ? (
              // Modo display_text: description es el contenido (requerido en ES);
              // label queda como título realmente opcional.
              <>
                <Textarea
                  rows={6}
                  value={translations[l].description}
                  onChange={(e) => setField(l, 'description', e.target.value)}
                  placeholder={t('displayTextBody')}
                  required={l === 'es'}
                />
                <Input
                  value={translations[l].label}
                  onChange={(e) => setField(l, 'label', e.target.value)}
                  placeholder={t('displayTextTitle')}
                />
              </>
            ) : (
              <>
                <Input
                  value={translations[l].label}
                  onChange={(e) => setField(l, 'label', e.target.value)}
                  placeholder={t('label')}
                  required={l === 'es'}
                />
                <Input
                  value={translations[l].placeholder}
                  onChange={(e) => setField(l, 'placeholder', e.target.value)}
                  placeholder={t('placeholder')}
                />
                <Textarea
                  rows={3}
                  value={translations[l].description}
                  onChange={(e) => setField(l, 'description', e.target.value)}
                  placeholder={t('descriptionLabel')}
                />
                {isEmailWithChange && (
                  <div className="space-y-2 rounded-md border border-dashed p-3">
                    <p className="text-muted-foreground text-xs">
                      {t('emailModalTextsHint')}
                    </p>
                    <Input
                      value={translations[l].option_labels?.modal_title ?? ''}
                      onChange={(e) =>
                        setOptionLabel(l, 'modal_title', e.target.value)
                      }
                      placeholder={t('emailModalTitlePlaceholder')}
                    />
                    <Textarea
                      rows={3}
                      value={translations[l].option_labels?.modal_body ?? ''}
                      onChange={(e) =>
                        setOptionLabel(l, 'modal_body', e.target.value)
                      }
                      placeholder={t('emailModalBodyPlaceholder')}
                    />
                  </div>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
