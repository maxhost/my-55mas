'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { saveFormDefinitionI18n } from '../actions/save-i18n';
import { saveFormDefinitionActivation } from '../actions/save-activation';
import type { CountryAdminOption } from '@/shared/lib/countries/types';
import type { FormDefinitionDetail, FormI18n } from '../types';
import { ConfigTab } from './config-tab';
import { I18nTab } from './i18n-tab';

type Props = {
  formDefinition: FormDefinitionDetail;
  countries: CountryAdminOption[];
};

export function FormDefinitionEditor({ formDefinition, countries }: Props) {
  const t = useTranslations('AdminFormDefinitions');
  const tc = useTranslations('Common');
  const [isPending, startTransition] = useTransition();

  const [isActive, setIsActive] = useState(formDefinition.is_active);
  const [countryIds, setCountryIds] = useState<string[]>(formDefinition.activeCountryIds);
  const [i18n, setI18n] = useState<FormI18n>(formDefinition.i18n ?? {});

  const handleSave = () => {
    startTransition(async () => {
      const activationResult = await saveFormDefinitionActivation({
        formId: formDefinition.id,
        is_active: isActive,
        countryIds,
      });
      if ('error' in activationResult) {
        const msg = Object.values(activationResult.error).flat()[0];
        toast.error(msg ?? tc('saveError'));
        return;
      }

      const i18nResult = await saveFormDefinitionI18n({
        formId: formDefinition.id,
        i18n,
      });
      if ('error' in i18nResult) {
        const msg = Object.values(i18nResult.error).flat()[0];
        toast.error(msg ?? tc('saveError'));
        return;
      }

      toast.success(tc('savedSuccess'));
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted/30 rounded-md border p-3 text-sm">
        <span className="font-mono text-xs">{formDefinition.form_key}</span>
        <span className="text-muted-foreground ml-2 text-xs">
          {t('schemaReadOnlyHint')}
        </span>
      </div>

      <Tabs defaultValue="config">
        <TabsList>
          <TabsTrigger value="config">{t('configTab')}</TabsTrigger>
          <TabsTrigger value="i18n">{t('translationsTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <ConfigTab
            isActive={isActive}
            countryIds={countryIds}
            countries={countries}
            onIsActiveChange={setIsActive}
            onCountryIdsChange={setCountryIds}
          />
        </TabsContent>

        <TabsContent value="i18n">
          <I18nTab schema={formDefinition.schema} i18n={i18n} onChange={setI18n} />
        </TabsContent>
      </Tabs>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? tc('saving') : tc('save')}
        </Button>
      </div>
    </div>
  );
}
