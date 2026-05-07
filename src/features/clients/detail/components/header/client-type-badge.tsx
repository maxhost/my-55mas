'use client';

import { Badge } from '@/components/ui/badge';

type Props = {
  isBusiness: boolean;
  labelBusiness: string;
  labelIndividual: string;
};

export function ClientTypeBadge({
  isBusiness,
  labelBusiness,
  labelIndividual,
}: Props) {
  return (
    <Badge variant="secondary">
      {isBusiness ? labelBusiness : labelIndividual}
    </Badge>
  );
}
