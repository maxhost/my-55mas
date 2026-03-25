'use client';

import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import type { CountryOption } from '../types';

type CountryPriceData = {
  country_id: string;
  base_price: number;
  is_active: boolean;
};

type Props = {
  country: CountryOption;
  data: CountryPriceData;
  onChange: (data: CountryPriceData) => void;
};

export function CountryPriceRow({ country, data, onChange }: Props) {
  return (
    <TableRow>
      <TableCell className="font-medium">{country.name}</TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          step={0.01}
          value={data.base_price || ''}
          onChange={(e) =>
            onChange({ ...data, base_price: parseFloat(e.target.value) || 0 })
          }
          className="w-32"
        />
      </TableCell>
      <TableCell className="text-muted-foreground">{country.currency}</TableCell>
      <TableCell>
        <input
          type="checkbox"
          checked={data.is_active}
          onChange={(e) => onChange({ ...data, is_active: e.target.checked })}
          className="h-4 w-4 rounded"
        />
      </TableCell>
    </TableRow>
  );
}
