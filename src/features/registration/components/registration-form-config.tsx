'use client';

import { useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Plus, X } from 'lucide-react';
import { saveRegistrationConfig } from '../actions/save-registration-config';
import { saveRegistrationActivation } from '../actions/save-registration-activation';
import type { FormVariantSummary, FormCountryOption, FormCityOption } from '@/shared/lib/forms/types';

type Props = {
  formId: string;
  targetRole: 'talent' | 'client';
  allCountries: FormCountryOption[];
  allCities: FormCityOption[];
  configuredCountryIds: string[];
  configuredCityIds: string[];
  formVariants: FormVariantSummary[];
};

export function RegistrationFormConfig({
  formId, targetRole, allCountries, allCities,
  configuredCountryIds: initialCountryIds,
  configuredCityIds: initialCityIds,
  formVariants: initialVariants,
}: Props) {
  const t = useTranslations('AdminRegistration');
  const tc = useTranslations('Common');
  const [countryIds, setCountryIds] = useState(initialCountryIds);
  const [cityIds, setCityIds] = useState(initialCityIds);
  const [variants, setVariants] = useState(initialVariants);
  const savedVariantsRef = useRef(initialVariants);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();
  const [selectedCountry, setSelectedCountry] = useState('');

  const availableCountries = allCountries.filter((c) => !countryIds.includes(c.id));
  const variantByCity = new Map(
    variants.filter((v) => v.city_id !== null).map((v) => [v.city_id!, v])
  );

  const addCountry = () => {
    if (!selectedCountry) return;
    setCountryIds((prev) => [...prev, selectedCountry]);
    setExpanded((prev) => ({ ...prev, [selectedCountry]: true }));
    setSelectedCountry('');
  };

  const removeCountry = (id: string) => {
    setCountryIds((prev) => prev.filter((c) => c !== id));
    const countryCities = allCities.filter((c) => c.country_id === id).map((c) => c.id);
    setCityIds((prev) => prev.filter((c) => !countryCities.includes(c)));
  };

  const toggleCity = (cityId: string) => {
    setCityIds((prev) =>
      prev.includes(cityId) ? prev.filter((c) => c !== cityId) : [...prev, cityId]
    );
  };

  const handleToggleActivation = (variantId: string, newState: boolean) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, is_active: newState } : v))
    );
  };

  const handleSave = () => {
    startTransition(async () => {
      // Save config (countries + cities)
      const configResult = await saveRegistrationConfig({
        form_id: formId, country_ids: countryIds, city_ids: cityIds,
      });
      if ('error' in configResult && configResult.error) {
        const errors = configResult.error as Record<string, string[] | undefined>;
        const firstMsg = Object.values(errors).flat().filter(Boolean)[0];
        toast.error(firstMsg ?? tc('saveError'));
        return;
      }

      // Save activation changes
      const savedByCity = new Map(
        savedVariantsRef.current.filter((v) => v.city_id !== null).map((v) => [v.id, v.is_active])
      );
      const activationChanges = variants
        .filter((v) => v.city_id !== null && savedByCity.get(v.id) !== v.is_active)
        .map((v) => ({ id: v.id, is_active: v.is_active }));

      if (activationChanges.length > 0) {
        await saveRegistrationActivation(activationChanges);
      }

      savedVariantsRef.current = [...variants];
      toast.success(tc('savedSuccess'));
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-medium">{t('configTitle')}</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          targetRole === 'talent'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {t('targetRole')}: {targetRole === 'talent' ? t('targetRoleTalent') : t('targetRoleClient')}
        </span>
      </div>
      <p className="text-muted-foreground text-sm">{t('configDesc')}</p>

      {/* Add country */}
      <div className="flex items-center gap-2">
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
        >
          <option value="">{t('selectCountry')}</option>
          {availableCountries.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={addCountry} disabled={!selectedCountry}>
          <Plus className="mr-1 h-3 w-3" /> {t('addCountry')}
        </Button>
      </div>

      {/* Country cards */}
      {countryIds.map((countryId) => {
        const country = allCountries.find((c) => c.id === countryId);
        if (!country) return null;
        const cities = allCities.filter((c) => c.country_id === countryId);
        const isExpanded = expanded[countryId] ?? true;

        return (
          <Card key={countryId}>
            <CardHeader className="flex flex-row items-center gap-3 py-3">
              <Button type="button" variant="ghost" size="icon-xs" onClick={() =>
                setExpanded((prev) => ({ ...prev, [countryId]: !prev[countryId] }))
              }>
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              <span className="text-sm font-semibold">{country.name}</span>
              <Button type="button" variant="ghost" size="icon-xs" className="ml-auto" onClick={() => removeCountry(countryId)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            {isExpanded && (
              <CardContent className="space-y-2 pt-0">
                {cities.map((city) => {
                  const isConfigured = cityIds.includes(city.id);
                  const variant = variantByCity.get(city.id);
                  return (
                    <div key={city.id} className="flex items-center gap-3 rounded-md border p-2">
                      <input type="checkbox" checked={isConfigured} onChange={() => toggleCity(city.id)} className="h-4 w-4" />
                      <span className="text-sm">{city.name}</span>
                      {variant && (
                        <label className="ml-auto flex items-center gap-1 text-xs">
                          <input type="checkbox" checked={variant.is_active}
                            onChange={(e) => handleToggleActivation(variant.id, e.target.checked)} className="h-3 w-3" />
                          {t('active')}
                        </label>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        );
      })}

      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? t('saving') : t('save')}
      </Button>
    </div>
  );
}
