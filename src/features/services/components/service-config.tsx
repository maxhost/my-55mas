'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { saveConfig } from '../actions/update-service';
import type { ServiceDetail, CountryOption, ServiceStatus } from '../types';
import { SERVICE_STATUSES } from '../types';
import { CountryPriceRow } from './country-price-row';

type CountryPriceData = {
  country_id: string;
  base_price: number;
  is_active: boolean;
};

type Props = {
  service: ServiceDetail;
  countries: CountryOption[];
};

export function ServiceConfig({ service, countries }: Props) {
  const t = useTranslations('AdminServices');
  const [isPending, startTransition] = useTransition();

  const [status, setStatus] = useState<ServiceStatus>(
    service.status as ServiceStatus
  );
  const [allowsRecurrence, setAllowsRecurrence] = useState(
    service.allows_recurrence
  );

  // Initialize country prices from existing data
  const initialPrices: Record<string, CountryPriceData> = {};
  for (const c of countries) {
    const existing = service.countries.find((sc) => sc.country_id === c.id);
    initialPrices[c.id] = existing
      ? {
          country_id: c.id,
          base_price: existing.base_price,
          is_active: existing.is_active,
        }
      : { country_id: c.id, base_price: 0, is_active: false };
  }
  const [prices, setPrices] =
    useState<Record<string, CountryPriceData>>(initialPrices);

  const updatePrice = (countryId: string, data: CountryPriceData) => {
    setPrices((prev) => ({ ...prev, [countryId]: data }));
  };

  const handleSave = () => {
    const countryRows = Object.values(prices).filter(
      (p) => p.base_price > 0 || p.is_active
    );
    startTransition(async () => {
      await saveConfig({
        service_id: service.id,
        status,
        allows_recurrence: allowsRecurrence,
        countries: countryRows,
      });
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          {t('country')} & {t('pricePerHour')}
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('country')}</TableHead>
              <TableHead>{t('pricePerHour')}</TableHead>
              <TableHead>{t('currency')}</TableHead>
              <TableHead>{t('active')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {countries.map((country) => (
              <CountryPriceRow
                key={country.id}
                country={country}
                data={prices[country.id]}
                onChange={(data) => updatePrice(country.id, data)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="max-w-md space-y-2">
        <Label>{t('status')}</Label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ServiceStatus)}
          className="border-border bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
        >
          {SERVICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(s)}
            </option>
          ))}
        </select>
      </div>

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

      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? t('saving') : t('save')}
      </Button>
    </div>
  );
}
