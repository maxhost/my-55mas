'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { CountryAdminOption, FiscalIdTypeInput } from '../types';

type Props = {
  type: FiscalIdTypeInput;
  locale: string;
  isPrimary: boolean;
  countries: CountryAdminOption[];
  onChange: (type: FiscalIdTypeInput) => void;
  onRemove: () => void;
};

export function FiscalIdTypeRow({
  type,
  locale,
  isPrimary,
  countries,
  onChange,
  onRemove,
}: Props) {
  const t = useTranslations('AdminFiscalIdTypes');

  const toggleCountry = (countryId: string, checked: boolean) => {
    const next = checked
      ? [...type.country_ids, countryId]
      : type.country_ids.filter((id) => id !== countryId);
    onChange({ ...type, country_ids: next });
  };

  return (
    <div className="bg-card flex flex-col gap-2 rounded-md border p-3">
      <div className="flex items-center gap-2">
        <Input
          value={type.code}
          onChange={(e) => onChange({ ...type, code: e.target.value.toUpperCase() })}
          placeholder={t('codePlaceholder')}
          className="h-8 w-32 text-sm"
          disabled={!isPrimary}
        />
        <Input
          value={type.translations[locale] ?? ''}
          onChange={(e) =>
            onChange({
              ...type,
              translations: { ...type.translations, [locale]: e.target.value },
            })
          }
          placeholder={t('labelPlaceholder')}
          className="h-8 flex-1 text-sm"
        />
        <label className="flex items-center gap-1 text-xs whitespace-nowrap">
          <input
            type="checkbox"
            checked={type.is_active}
            onChange={(e) => onChange({ ...type, is_active: e.target.checked })}
            className="h-3 w-3"
            disabled={!isPrimary}
          />
          {t('active')}
        </label>
        {isPrimary && (
          <Button type="button" variant="ghost" size="icon-xs" onClick={onRemove}>
            <X />
          </Button>
        )}
      </div>

      {isPrimary && (
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="text-muted-foreground text-xs">{t('countries')}:</span>
          {countries.length === 0 && (
            <span className="text-muted-foreground text-xs italic">{t('noCountries')}</span>
          )}
          {countries.map((c) => (
            <label key={c.id} className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={type.country_ids.includes(c.id)}
                onChange={(e) => toggleCountry(c.id, e.target.checked)}
                className="h-3 w-3"
              />
              {c.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
