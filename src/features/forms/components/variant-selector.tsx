'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { FormVariantSummary, FormCountryOption } from '../types';

type Props = {
  variants: FormVariantSummary[];
  serviceCountries: FormCountryOption[];
  activeVariant: string | null;
  onVariantChange: (countryId: string | null) => void;
  onCreateVariant: (countryId: string) => void;
  isCreating: boolean;
};

export function VariantSelector({
  variants,
  serviceCountries,
  activeVariant,
  onVariantChange,
  onCreateVariant,
  isCreating,
}: Props) {
  const t = useTranslations('AdminFormBuilder');

  // Countries that already have a variant
  const variantCountryIds = new Set(
    variants
      .map((v) => v.country_id)
      .filter((id): id is string => id !== null)
  );

  // Countries available for creating new variants
  const availableCountries = serviceCountries.filter(
    (c) => !variantCountryIds.has(c.id)
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-sm font-medium">{t('variant')}:</label>
      <select
        value={activeVariant ?? ''}
        onChange={(e) => onVariantChange(e.target.value || null)}
        className="border-border bg-background h-9 rounded-md border px-3 text-sm"
      >
        <option value="">{t('general')}</option>
        {variants
          .filter((v) => v.country_id !== null)
          .map((v) => (
            <option key={v.country_id} value={v.country_id!}>
              {v.country_name ?? v.country_id}
            </option>
          ))}
      </select>

      {availableCountries.length > 0 && (
        <div className="flex items-center gap-1">
          {availableCountries.map((country) => (
            <Button
              key={country.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onCreateVariant(country.id)}
              disabled={isCreating}
            >
              <Plus className="mr-1 h-3 w-3" />
              {t('createVariantFor', { country: country.name })}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
