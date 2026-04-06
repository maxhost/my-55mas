'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { MemberListItem, StaffRole } from '../types';

type Props = {
  members: MemberListItem[];
};

const roleVariant: Record<StaffRole, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  manager: 'secondary',
  viewer: 'outline',
};

export function MembersTable({ members }: Props) {
  const t = useTranslations('AdminMembers');

  if (members.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center">
        {t('noMembers')}
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('fullName')}</TableHead>
          <TableHead>{t('role')}</TableHead>
          <TableHead>{t('email')}</TableHead>
          <TableHead>{t('teams')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.user_id}>
            <TableCell className="font-medium">
              {member.full_name ?? '—'}
            </TableCell>
            <TableCell>
              <Badge variant={roleVariant[member.role] ?? 'outline'}>
                {member.role_display_name}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {member.email ?? '—'}
            </TableCell>
            <TableCell>
              <TeamChips
                teams={member.teams}
                noTeamsLabel={t('noTeams')}
                moreLabel={
                  member.teams.length > 1
                    ? t('moreTeams', { count: member.teams.length - 1 })
                    : undefined
                }
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

type TeamChipsProps = {
  teams: MemberListItem['teams'];
  noTeamsLabel: string;
  moreLabel?: string;
};

function TeamChips({ teams, noTeamsLabel, moreLabel }: TeamChipsProps) {
  if (teams.length === 0) {
    return <span className="text-muted-foreground text-xs">{noTeamsLabel}</span>;
  }

  const first = teams[0].name;
  const rest = teams.slice(1);

  return (
    <div className="flex items-center gap-1">
      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
        {first}
      </span>
      {rest.length > 0 && (
        <span
          className="text-muted-foreground cursor-default text-xs"
          title={rest.map((t) => t.name).join(', ')}
        >
          {moreLabel}
        </span>
      )}
    </div>
  );
}
