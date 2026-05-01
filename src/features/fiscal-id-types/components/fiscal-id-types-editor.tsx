'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { locales } from '@/lib/i18n/config';
import { saveFiscalIdType } from '../actions/save-fiscal-id-type';
import { deleteFiscalIdType } from '../actions/delete-fiscal-id-type';
import type {
  CountryAdminOption,
  FiscalIdTypeInput,
  FiscalIdTypeWithDetails,
} from '../types';
import { FiscalIdTypeRow } from './fiscal-id-type-row';

type Props = {
  initialTypes: FiscalIdTypeWithDetails[];
  countries: CountryAdminOption[];
};

function toInput(type: FiscalIdTypeWithDetails): FiscalIdTypeInput {
  return {
    id: type.id,
    code: type.code,
    sort_order: type.sort_order,
    is_active: type.is_active,
    translations: { ...type.translations },
    country_ids: [...type.country_ids],
  };
}

export function FiscalIdTypesEditor({ initialTypes, countries }: Props) {
  const t = useTranslations('AdminFiscalIdTypes');
  const tc = useTranslations('Common');
  const [isPending, startTransition] = useTransition();
  const [types, setTypes] = useState<FiscalIdTypeInput[]>(initialTypes.map(toInput));
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const primaryLocale = locales[0];

  const addType = () => {
    setTypes([
      ...types,
      {
        code: '',
        sort_order: types.length,
        is_active: true,
        translations: {},
        country_ids: [],
      },
    ]);
  };

  const updateType = (index: number, type: FiscalIdTypeInput) => {
    setTypes(types.map((t, i) => (i === index ? type : t)));
  };

  const removeType = (index: number) => {
    const type = types[index];
    if (type.id) setRemovedIds([...removedIds, type.id]);
    setTypes(types.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const normalized = types.map((type, i) => ({ ...type, sort_order: i }));

    startTransition(async () => {
      for (const id of removedIds) {
        const result = await deleteFiscalIdType(id);
        if ('error' in result) {
          toast.error(Object.values(result.error).flat()[0] ?? tc('saveError'));
          return;
        }
      }

      for (const type of normalized) {
        const result = await saveFiscalIdType({ fiscalIdType: type });
        if ('error' in result) {
          const msg = Object.values(result.error).flat().filter(Boolean)[0];
          toast.error(msg ?? tc('saveError'));
          return;
        }
      }

      toast.success(tc('savedSuccess'));
      setTypes(normalized);
      setRemovedIds([]);
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
            {types.length === 0 && (
              <p className="text-muted-foreground py-4 text-sm">{t('noTypes')}</p>
            )}

            {types.map((type, index) => (
              <FiscalIdTypeRow
                key={type.id ?? `new-${index}`}
                type={type}
                locale={locale}
                isPrimary={locale === primaryLocale}
                countries={countries}
                onChange={(updated) => updateType(index, updated)}
                onRemove={() => removeType(index)}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={addType}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addType')}
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? tc('saving') : tc('save')}
        </Button>
      </div>
    </div>
  );
}
