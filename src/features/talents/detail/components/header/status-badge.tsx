'use client';

import { Badge } from '@/components/ui/badge';
import type { TalentStatus } from '@/features/talents/types';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

const VARIANT_BY_STATUS: Record<TalentStatus, BadgeVariant> = {
  registered: 'secondary',
  evaluation: 'secondary',
  active: 'default',
  archived: 'outline',
  inactive: 'outline',
  excluded: 'destructive',
};

type Props = {
  status: TalentStatus;
  label: string;
};

export function StatusBadge({ status, label }: Props) {
  const variant = VARIANT_BY_STATUS[status];
  return <Badge variant={variant}>{label}</Badge>;
}
