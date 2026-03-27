'use client';

import { useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { saveTalentFormActivation } from '../actions/save-talent-form-activation';
import type { FormVariantSummary, FormCountryOption, FormCityOption } from '@/shared/lib/forms/types';

type Props = {
  serviceCountries: FormCountryOption[];
  serviceCities: FormCityOption[];
  formVariants: FormVariantSummary[];
};

export function TalentServiceConfig({ serviceCountries, serviceCities, formVariants }: Props) {
  const t = useTranslations('AdminTalentServices');
  const tc = useTranslations('Common');
  const [variants, setVariants] = useState(formVariants);
  const savedRef = useRef(formVariants);
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(serviceCountries.map((c) => [c.id, true]))
  );

  // Map city_id → variant (excluding General)
  const variantByCity = new Map(
    variants.filter((v) => v.city_id !== null).map((v) => [v.city_id!, v])
  );

  // Group cities by country
  const citiesByCountry = new Map<string, FormCityOption[]>();
  for (const city of serviceCities) {
    if (!citiesByCountry.has(city.country_id)) citiesByCountry.set(city.country_id, []);
    citiesByCountry.get(city.country_id)!.push(city);
  }

  // Detect pending changes (only city variants, not General)
  const savedByCity = new Map(
    savedRef.current.filter((v) => v.city_id !== null).map((v) => [v.id, v.is_active])
  );
  const hasChanges = variants
    .filter((v) => v.city_id !== null)
    .some((v) => savedByCity.get(v.id) !== v.is_active);

  const handleToggle = (variantId: string, newState: boolean) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, is_active: newState } : v))
    );
  };

  const handleSave = () => {
    // Compute diff: only changed variants
    const changes = variants
      .filter((v) => v.city_id !== null && savedByCity.get(v.id) !== v.is_active)
      .map((v) => ({ form_id: v.id, is_active: v.is_active }));

    startTransition(async () => {
      const result = await saveTalentFormActivation(changes);
      if ('error' in result) {
        const firstMsg = Object.values(result.error).flat()[0];
        toast.error(firstMsg ?? tc('saveError'));
        return;
      }
      savedRef.current = [...variants];
      toast.success(tc('savedSuccess'));
    });
  };

  const toggleExpanded = (countryId: string) => {
    setExpanded((prev) => ({ ...prev, [countryId]: !prev[countryId] }));
  };

  if (serviceCountries.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t('cityActivation')}</h3>
        <p className="text-muted-foreground py-4 text-sm">{t('noCities')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{t('cityActivation')}</h3>
      <p className="text-muted-foreground text-sm">{t('cityActivationDesc')}</p>

      {serviceCountries.map((country) => {
        const cities = citiesByCountry.get(country.id) ?? [];
        if (cities.length === 0) return null;
        const isExpanded = expanded[country.id] ?? true;

        return (
          <Card key={country.id}>
            <CardHeader className="flex flex-row items-center gap-3 py-3">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => toggleExpanded(country.id)}
              >
                {isExpanded
                  ? <ChevronDown className="h-4 w-4" />
                  : <ChevronRight className="h-4 w-4" />}
              </Button>
              <span className="text-sm font-semibold">{country.name}</span>
            </CardHeader>

            {isExpanded && (
              <CardContent className="space-y-2 pt-0">
                {cities.map((city) => {
                  const variant = variantByCity.get(city.id);
                  const hasVariant = !!variant;

                  return (
                    <div key={city.id} className="flex items-center gap-3 rounded-md border p-3">
                      <input
                        type="checkbox"
                        checked={hasVariant && variant.is_active}
                        disabled={!hasVariant}
                        onChange={(e) => {
                          if (variant) handleToggle(variant.id, e.target.checked);
                        }}
                        className="h-4 w-4"
                      />
                      <div>
                        <span className="text-sm font-medium">{city.name}</span>
                        {!hasVariant && (
                          <p className="text-muted-foreground text-xs">{t('noVariant')}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        );
      })}

      <Button onClick={handleSave} disabled={!hasChanges || isPending}>
        {isPending ? t('saving') : t('save')}
      </Button>
    </div>
  );
}
