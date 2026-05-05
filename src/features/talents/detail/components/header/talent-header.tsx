'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  HeaderHints,
  TalentDetail,
  TalentTagOption,
} from '@/features/talents/detail/types';
import { StatusBadge } from './status-badge';
import { TalentTagsDisplay } from './talent-tags-display';
import { UpdateStatusModal } from './update-status-modal';

type Props = {
  talent: TalentDetail;
  availableTags: TalentTagOption[];
  hints: HeaderHints;
  onStatusChanged: () => void;
  onTagsChanged: () => void;
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

export function TalentHeader({
  talent,
  availableTags,
  hints,
  onStatusChanged,
  onTagsChanged,
}: Props) {
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const showOnboardingHint =
    talent.onboarding_completed_at === null &&
    (talent.status === 'registered' || talent.status === 'evaluation');

  const subParts: string[] = [];
  subParts.push(talent.phone ?? hints.noPhone);
  subParts.push(talent.email ?? hints.noEmail);
  if (talent.country_id && talent.country_name) {
    subParts.push(talent.country_name);
  }

  return (
    <div className="flex items-start gap-4 px-6 py-4">
      <Avatar className="size-14">
        {talent.photo_url ? (
          <AvatarImage src={talent.photo_url} alt={talent.full_name ?? ''} />
        ) : null}
        <AvatarFallback className="text-base font-medium">
          {getInitials(talent.full_name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-xl font-semibold leading-tight">
            {talent.full_name ?? '—'}
          </h1>
          <StatusBadge
            status={talent.status}
            label={hints.statusLabels[talent.status]}
          />
          {showOnboardingHint ? (
            <Badge variant="outline" className="border-amber-300 text-amber-700">
              {hints.noOnboarding}
            </Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">
          {subParts.join(' · ')}
        </p>
        <TalentTagsDisplay
          talentId={talent.id}
          assignedTags={talent.tags}
          availableTags={availableTags}
          hints={hints}
          onTagsChanged={onTagsChanged}
        />
      </div>

      <div className="flex shrink-0 items-start">
        <Button onClick={() => setStatusModalOpen(true)}>
          {hints.updateStatusButton}
        </Button>
      </div>

      <UpdateStatusModal
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        talentId={talent.id}
        currentStatus={talent.status}
        hints={hints}
        onStatusChanged={onStatusChanged}
      />
    </div>
  );
}
