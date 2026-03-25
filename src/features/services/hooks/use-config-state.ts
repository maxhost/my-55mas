import { useState, useCallback } from 'react';
import type { ServiceDetail, CityOption } from '../types';
import type { CityPriceInput, CountryPriceInput } from '../schemas';
import type { CityPriceData } from '../components/city-price-row';
import { computeCountryRows } from '../actions/config-helpers';

export function useConfigState(service: ServiceDetail) {
  const [configuredCountryIds, setConfiguredCountryIds] = useState<string[]>(
    () => service.countries.map((sc) => sc.country_id),
  );

  const [templatePrices, setTemplatePrices] = useState<Record<string, number>>(
    () => Object.fromEntries(service.countries.map((sc) => [sc.country_id, sc.base_price])),
  );

  const [configuredCityIds, setConfiguredCityIds] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    for (const sc of service.countries) map[sc.country_id] = [];
    for (const c of service.cities) (map[c.country_id] ??= []).push(c.city_id);
    return map;
  });

  const [cityData, setCityData] = useState<Record<string, CityPriceData>>(() =>
    Object.fromEntries(
      service.cities.map((c) => [
        c.city_id,
        { city_id: c.city_id, country_id: c.country_id, base_price: c.base_price, is_active: c.is_active },
      ]),
    ),
  );

  const addCountry = useCallback((countryId: string) => {
    setConfiguredCountryIds((prev) => [...prev, countryId]);
    setTemplatePrices((prev) => ({ ...prev, [countryId]: 0 }));
    setConfiguredCityIds((prev) => ({ ...prev, [countryId]: [] }));
  }, []);

  const removeCountry = useCallback((countryId: string) => {
    setConfiguredCountryIds((prev) => prev.filter((id) => id !== countryId));
    setTemplatePrices((prev) => { const n = { ...prev }; delete n[countryId]; return n; });
    setConfiguredCityIds((prev) => {
      const ids = prev[countryId] ?? [];
      setCityData((cd) => {
        const n = { ...cd };
        for (const id of ids) delete n[id];
        return n;
      });
      const n = { ...prev };
      delete n[countryId];
      return n;
    });
  }, []);

  const addCity = useCallback((countryId: string, cityId: string) => {
    setConfiguredCityIds((prev) => ({
      ...prev,
      [countryId]: [...(prev[countryId] ?? []), cityId],
    }));
    setCityData((prev) => ({
      ...prev,
      [cityId]: {
        city_id: cityId,
        country_id: countryId,
        base_price: templatePrices[countryId] ?? 0,
        is_active: true,
      },
    }));
  }, [templatePrices]);

  const removeCity = useCallback((countryId: string, cityId: string) => {
    setConfiguredCityIds((prev) => ({
      ...prev,
      [countryId]: (prev[countryId] ?? []).filter((id) => id !== cityId),
    }));
    setCityData((prev) => { const n = { ...prev }; delete n[cityId]; return n; });
  }, []);

  const updateCity = useCallback((cityId: string, data: CityPriceData) => {
    setCityData((prev) => ({ ...prev, [cityId]: data }));
  }, []);

  const updateTemplatePrice = useCallback((countryId: string, price: number) => {
    setTemplatePrices((prev) => ({ ...prev, [countryId]: price }));
  }, []);

  const applyToCities = useCallback((countryId: string) => {
    const price = templatePrices[countryId] ?? 0;
    const ids = configuredCityIds[countryId] ?? [];
    setCityData((prev) => {
      const n = { ...prev };
      for (const id of ids) {
        if (n[id]) n[id] = { ...n[id], base_price: price };
      }
      return n;
    });
  }, [templatePrices, configuredCityIds]);

  const buildSavePayload = useCallback((): {
    countries: CountryPriceInput[];
    cities: CityPriceInput[];
  } => {
    const allCities = Object.values(cityData);
    const countries = computeCountryRows(configuredCountryIds, templatePrices, allCities);
    const cities: CityPriceInput[] = allCities.map((c) => ({
      city_id: c.city_id,
      country_id: c.country_id,
      base_price: c.base_price,
      is_active: c.is_active,
    }));
    return { countries, cities };
  }, [configuredCountryIds, templatePrices, cityData]);

  return {
    configuredCountryIds,
    templatePrices,
    configuredCityIds,
    cityData,
    addCountry,
    removeCountry,
    addCity,
    removeCity,
    updateCity,
    updateTemplatePrice,
    applyToCities,
    buildSavePayload,
  };
}
