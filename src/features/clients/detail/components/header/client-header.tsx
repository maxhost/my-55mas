'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  ClientDetail,
  HeaderHints,
} from '@/features/clients/detail/types';
import { ClientTypeBadge } from './client-type-badge';
import { DeleteClientModal } from './delete-client-modal';

type Props = {
  client: ClientDetail;
  hints: HeaderHints;
  onDeleted: () => void;
};

function getInitials(fullName: string | null): string {
  if (!fullName) return '?';
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  const initials = `${first}${last}`.toUpperCase();
  return initials || '?';
}

export function ClientHeader({ client, hints, onDeleted }: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  const subParts: string[] = [];
  subParts.push(client.phone ?? hints.noPhone);
  subParts.push(client.email ?? hints.noEmail);
  if (client.country_id && client.country_name) {
    subParts.push(client.country_name);
  }

  const showCompanyLine = client.is_business && !!client.company_name;

  return (
    <div className="flex items-start gap-4 px-6 py-4">
      <Avatar className="size-14">
        {client.avatar_url ? (
          <AvatarImage src={client.avatar_url} alt={client.full_name ?? ''} />
        ) : null}
        <AvatarFallback className="text-base font-medium">
          {getInitials(client.full_name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-xl font-semibold leading-tight">
            {client.full_name ?? '—'}
          </h1>
          <ClientTypeBadge
            isBusiness={client.is_business}
            labelBusiness={hints.typeBusiness}
            labelIndividual={hints.typeIndividual}
          />
          <Badge variant={client.status === 'active' ? 'default' : 'outline'}>
            {hints.statusLabels[client.status]}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          {subParts.join(' · ')}
        </p>
        {showCompanyLine ? (
          <p className="text-muted-foreground text-xs">
            {client.company_name}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-start">
        <Button
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
        >
          {hints.deleteButton}
        </Button>
      </div>

      <DeleteClientModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        clientId={client.id}
        clientFullName={client.full_name}
        hints={hints}
        onDeleted={onDeleted}
      />
    </div>
  );
}
