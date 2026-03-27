'use client';

import { useTranslations } from 'next-intl';
import type { FormCountryOption, FormCityOption } from '@/shared/lib/forms/types';

type Props = {
  serviceCountries: FormCountryOption[];
  serviceCities: FormCityOption[];
  activeCountry: string | null;
  activeCity: string | null;
  onCountryChange: (countryId: string | null) => void;
  onCityChange: (cityId: string | null) => void;
  isLoading: boolean;
};

export function VariantSelector({
  serviceCountries,
  serviceCities,
  activeCountry,
  activeCity,
  onCountryChange,
  onCityChange,
  isLoading,
}: Props) {
  const t = useTranslations('AdminFormBuilder');

  const citiesForCountry = activeCountry
    ? serviceCities.filter((c) => c.country_id === activeCountry)
    : [];

  const handleCountryChange = (value: string) => {
    const countryId = value || null;
    onCountryChange(countryId);
    // Reset city when country changes
    onCityChange(countryId === null ? null : '');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">{t('variant')}:</label>
        <select
          value={activeCountry ?? ''}
          onChange={(e) => handleCountryChange(e.target.value)}
          disabled={isLoading}
          className="border-border bg-background h-9 rounded-md border px-3 text-sm"
        >
          <option value="">{t('general')}</option>
          {serviceCountries.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {activeCountry && citiesForCountry.length > 0 && (
          <select
            value={activeCity ?? ''}
            onChange={(e) => onCityChange(e.target.value || null)}
            disabled={isLoading}
            className="border-border bg-background h-9 rounded-md border px-3 text-sm"
          >
            <option value="">{t('selectCity')}</option>
            {citiesForCountry.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

      </div>

      {activeCountry === null && (
        <p className="text-muted-foreground text-xs">{t('cascadeInfo')}</p>
      )}
      {activeCountry && citiesForCountry.length === 0 && (
        <p className="text-muted-foreground text-xs">{t('noCitiesForCountry')}</p>
      )}
      {activeCountry && citiesForCountry.length > 0 && !activeCity && (
        <p className="text-muted-foreground text-xs">{t('selectCityPrompt')}</p>
      )}
      {serviceCountries.length === 0 && (
        <p className="text-muted-foreground text-xs">{t('noCountriesConfigured')}</p>
      )}
    </div>
  );
}
