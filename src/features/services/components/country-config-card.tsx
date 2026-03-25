'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronDown, ChevronRight, Plus, X } from 'lucide-react';
import type { CountryOption, CityOption } from '../types';
import { CityPriceRow, type CityPriceData } from './city-price-row';

type Props = {
  country: CountryOption;
  templatePrice: number;
  cities: CityPriceData[];
  allCitiesForCountry: CityOption[];
  onTemplateChange: (price: number) => void;
  onApplyToCities: () => void;
  onCityAdd: (cityId: string) => void;
  onCityRemove: (cityId: string) => void;
  onCityChange: (cityId: string, data: CityPriceData) => void;
  onCountryRemove: () => void;
};

export function CountryConfigCard({
  country,
  templatePrice,
  cities,
  allCitiesForCountry,
  onTemplateChange,
  onApplyToCities,
  onCityAdd,
  onCityRemove,
  onCityChange,
  onCountryRemove,
}: Props) {
  const t = useTranslations('AdminServices');
  const [expanded, setExpanded] = useState(true);
  const [selectedCity, setSelectedCity] = useState('');

  const configuredCityIds = new Set(cities.map((c) => c.city_id));
  const availableCities = allCitiesForCountry.filter((c) => !configuredCityIds.has(c.id));
  const cityNameMap = Object.fromEntries(allCitiesForCountry.map((c) => [c.id, c.name]));

  const handleAddCity = () => {
    if (!selectedCity) return;
    onCityAdd(selectedCity);
    setSelectedCity('');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        <span className="text-sm font-semibold">{country.name}</span>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">{t('templatePrice')}:</span>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={templatePrice || ''}
            onChange={(e) => onTemplateChange(parseFloat(e.target.value) || 0)}
            className="w-28"
          />
          <span className="text-muted-foreground text-xs">{country.currency}</span>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={onApplyToCities}>
          {t('applyToCities')}
        </Button>

        <div className="ml-auto">
          <Button type="button" variant="ghost" size="icon-xs" onClick={onCountryRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-3 pt-0">
          {availableCities.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="border-border bg-background h-9 rounded-md border px-3 text-sm"
              >
                <option value="">{t('selectCity')}</option>
                {availableCities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <Button type="button" variant="outline" size="sm" onClick={handleAddCity} disabled={!selectedCity}>
                <Plus className="mr-1 h-3 w-3" />
                {t('addCity')}
              </Button>
            </div>
          )}

          {cities.length === 0 ? (
            <p className="text-muted-foreground py-2 text-sm">{t('noCities')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('city')}</TableHead>
                  <TableHead>{t('pricePerHour')}</TableHead>
                  <TableHead>{t('active')}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cities.map((cityData) => (
                  <CityPriceRow
                    key={cityData.city_id}
                    cityName={cityNameMap[cityData.city_id] ?? cityData.city_id}
                    data={cityData}
                    onChange={(d) => onCityChange(cityData.city_id, d)}
                    onRemove={() => onCityRemove(cityData.city_id)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      )}
    </Card>
  );
}
