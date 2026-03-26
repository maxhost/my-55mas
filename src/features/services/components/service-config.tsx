'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { saveConfig } from '../actions/update-service';
import { canPublish } from '../actions/config-helpers';
import type { ServiceDetail, CountryOption, CityOption, ServiceStatus, ServiceCountryDetail, ServiceCityDetail } from '../types';
import { SERVICE_STATUSES } from '../types';
import { useConfigState } from '../hooks/use-config-state';
import { CountryConfigCard } from './country-config-card';

type Props = {
  service: ServiceDetail;
  countries: CountryOption[];
  allCities: CityOption[];
  onCountriesChange?: (countries: ServiceCountryDetail[]) => void;
  onCitiesChange?: (cities: ServiceCityDetail[]) => void;
};

export function ServiceConfig({ service, countries, allCities, onCountriesChange, onCitiesChange }: Props) {
  const t = useTranslations('AdminServices');
  const tc = useTranslations('Common');
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<ServiceStatus>(service.status as ServiceStatus);
  const [allowsRecurrence, setAllowsRecurrence] = useState(service.allows_recurrence);
  const [selectedCountry, setSelectedCountry] = useState('');

  const state = useConfigState(service);
  const availableCountries = countries.filter((c) => !state.configuredCountryIds.includes(c.id));
  const configuredCountries = state.configuredCountryIds
    .map((id) => countries.find((c) => c.id === id))
    .filter((c): c is CountryOption => c !== undefined);

  const handleAddCountry = () => {
    if (!selectedCountry) return;
    state.addCountry(selectedCountry);
    setSelectedCountry('');
  };

  const handleSave = () => {
    const { countries: countryRows, cities: cityRows } = state.buildSavePayload();

    startTransition(async () => {
      const result = await saveConfig({
        service_id: service.id,
        status,
        allows_recurrence: allowsRecurrence,
        countries: countryRows,
        cities: cityRows,
      });

      if (result && 'error' in result) {
        toast.error(tc('saveError'));
        return;
      }

      toast.success(tc('savedSuccess'));

      if (onCountriesChange) {
        const updated: ServiceCountryDetail[] = countryRows.map((row) => {
          const c = countries.find((co) => co.id === row.country_id)!;
          return {
            service_id: service.id,
            country_id: row.country_id,
            base_price: row.base_price,
            is_active: row.is_active,
            country_name: c.name,
            currency: c.currency,
            country_code: c.code,
          };
        });
        onCountriesChange(updated);
      }

      if (onCitiesChange) {
        const updatedCities: ServiceCityDetail[] = cityRows.map((row) => {
          const city = allCities.find((c) => c.id === row.city_id);
          return {
            service_id: service.id,
            city_id: row.city_id,
            base_price: row.base_price,
            is_active: row.is_active,
            city_name: city?.name ?? '',
            country_id: city?.country_id ?? '',
          };
        });
        onCitiesChange(updatedCities);
      }
    });
  };

  const allCityData = Object.values(state.cityData);
  const publishBlocked = status === 'published' && !canPublish(allCityData);

  return (
    <div className="space-y-6">
      {/* Country selector */}
      {availableCountries.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="border-border bg-background h-9 rounded-md border px-3 text-sm"
          >
            <option value="">{t('selectCountry')}</option>
            {availableCountries.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Button type="button" variant="outline" size="sm" onClick={handleAddCountry} disabled={!selectedCountry}>
            <Plus className="mr-1 h-3 w-3" />
            {t('addCountry')}
          </Button>
        </div>
      )}

      {/* Country cards */}
      {configuredCountries.length === 0 ? (
        <p className="text-muted-foreground py-4 text-sm">{t('noCountries')}</p>
      ) : (
        <div className="space-y-4">
          {configuredCountries.map((country) => {
            const citiesForCountry = allCities.filter((c) => c.country_id === country.id);
            const configuredIds = state.configuredCityIds[country.id] ?? [];
            const cityList = configuredIds
              .map((id) => state.cityData[id])
              .filter(Boolean);

            return (
              <CountryConfigCard
                key={country.id}
                country={country}
                templatePrice={state.templatePrices[country.id] ?? 0}
                cities={cityList}
                allCitiesForCountry={citiesForCountry}
                onTemplateChange={(p) => state.updateTemplatePrice(country.id, p)}
                onApplyToCities={() => state.applyToCities(country.id)}
                onCityAdd={(cityId) => state.addCity(country.id, cityId)}
                onCityRemove={(cityId) => state.removeCity(country.id, cityId)}
                onCityChange={(cityId, d) => state.updateCity(cityId, d)}
                onCountryRemove={() => state.removeCountry(country.id)}
              />
            );
          })}
        </div>
      )}

      {/* Status */}
      <div className="max-w-md space-y-2">
        <Label>{t('status')}</Label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ServiceStatus)}
          className="border-border bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
        >
          {SERVICE_STATUSES.map((s) => (
            <option key={s} value={s}>{t(s)}</option>
          ))}
        </select>
        {publishBlocked && (
          <p className="text-destructive text-xs">
            {t('noCities')}
          </p>
        )}
      </div>

      {/* Recurrence */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="recurrence"
          checked={allowsRecurrence}
          onChange={(e) => setAllowsRecurrence(e.target.checked)}
          className="h-4 w-4 rounded"
        />
        <Label htmlFor="recurrence">{t('allowsRecurrence')}</Label>
      </div>

      <Button onClick={handleSave} disabled={isPending || publishBlocked}>
        {isPending ? t('saving') : t('save')}
      </Button>
    </div>
  );
}
