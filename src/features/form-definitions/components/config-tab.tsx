'use client';

import { useTranslations } from 'next-intl';
import type { CountryAdminOption } from '@/shared/lib/countries/types';

type Props = {
  isActive: boolean;
  countryIds: string[];
  countries: CountryAdminOption[];
  onIsActiveChange: (v: boolean) => void;
  onCountryIdsChange: (ids: string[]) => void;
};

export function ConfigTab({
  isActive,
  countryIds,
  countries,
  onIsActiveChange,
  onCountryIdsChange,
}: Props) {
  const t = useTranslations('AdminFormDefinitions');

  const toggleCountry = (id: string, checked: boolean) => {
    onCountryIdsChange(
      checked ? [...countryIds, id] : countryIds.filter((c) => c !== id)
    );
  };

  return (
    <div className="space-y-6 pt-3">
      <div className="bg-muted/30 rounded-md border p-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => onIsActiveChange(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="font-medium">{t('globalActive')}</span>
        </label>
        <p className="text-muted-foreground mt-1 text-xs">{t('globalActiveHelp')}</p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">{t('activeCountries')}</h3>
        <p className="text-muted-foreground mb-3 text-xs">{t('activeCountriesHelp')}</p>
        {countries.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">{t('noCountries')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {countries.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={countryIds.includes(c.id)}
                  onChange={(e) => toggleCountry(c.id, e.target.checked)}
                  className="h-4 w-4"
                />
                <span>{c.name}</span>
                <span className="text-muted-foreground text-xs">({c.code})</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
