'use client';

import { useTranslations } from 'next-intl';
import type { FormCountryOption } from '../types';

type Props = {
  serviceCountries: FormCountryOption[];
  activeVariant: string | null;
  onVariantChange: (countryId: string | null) => void;
  isLoading: boolean;
};

export function VariantSelector({
  serviceCountries,
  activeVariant,
  onVariantChange,
  isLoading,
}: Props) {
  const t = useTranslations('AdminFormBuilder');

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">{t('variant')}:</label>
        <select
          value={activeVariant ?? ''}
          onChange={(e) => onVariantChange(e.target.value || null)}
          disabled={isLoading}
          className="border-border bg-background h-9 rounded-md border px-3 text-sm"
        >
          <option value="">{t('general')}</option>
          {serviceCountries.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {isLoading && (
          <span className="text-muted-foreground text-sm">{t('cloning')}</span>
        )}
      </div>
      {activeVariant === null && (
        <p className="text-muted-foreground text-xs">{t('cascadeInfo')}</p>
      )}
      {serviceCountries.length === 0 && (
        <p className="text-muted-foreground text-xs">{t('noCountriesConfigured')}</p>
      )}
    </div>
  );
}
