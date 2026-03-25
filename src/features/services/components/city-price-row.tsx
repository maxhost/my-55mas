'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { X } from 'lucide-react';

export type CityPriceData = {
  city_id: string;
  country_id: string;
  base_price: number;
  is_active: boolean;
};

type Props = {
  cityName: string;
  data: CityPriceData;
  onChange: (data: CityPriceData) => void;
  onRemove: () => void;
};

export function CityPriceRow({ cityName, data, onChange, onRemove }: Props) {
  return (
    <TableRow>
      <TableCell className="font-medium">{cityName}</TableCell>
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
      <TableCell>
        <input
          type="checkbox"
          checked={data.is_active}
          onChange={(e) => onChange({ ...data, is_active: e.target.checked })}
          className="h-4 w-4 rounded"
        />
      </TableCell>
      <TableCell>
        <Button type="button" variant="ghost" size="icon-xs" onClick={onRemove}>
          <X />
        </Button>
      </TableCell>
    </TableRow>
  );
}
