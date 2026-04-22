'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  PersistenceTarget,
  PersistenceType,
} from '@/shared/lib/field-catalog/types';
import { USER_OWNED_DB_COLUMN_TABLES } from '@/shared/lib/field-catalog/persistence/context';
import type { SubtypeGroupOption } from '@/shared/lib/field-catalog/subtype-groups';

type Props = {
  persistenceType: PersistenceType;
  target: PersistenceTarget;
  onChange: (target: PersistenceTarget) => void;
  subtypeGroups: SubtypeGroupOption[];
};

const AUTH_FIELDS = ['email', 'password', 'confirm_password'] as const;
const USER_TABLES = Object.keys(USER_OWNED_DB_COLUMN_TABLES);

export function PersistenceTargetFields({
  persistenceType,
  target,
  onChange,
  subtypeGroups,
}: Props) {
  const t = useTranslations('AdminFieldCatalog');

  if (persistenceType === 'db_column') {
    const t2 = target as { table: string; column: string } | null;
    const current = t2 ?? { table: 'profiles', column: '' };
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t('persistenceTargetTable')}</Label>
          <Select
            value={current.table}
            onValueChange={(v) => {
              if (v == null) return;
              onChange({ ...current, table: v });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USER_TABLES.map((tbl) => (
                <SelectItem key={tbl} value={tbl}>
                  {tbl}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t('persistenceTargetColumn')}</Label>
          <Input
            value={current.column}
            onChange={(e) => onChange({ ...current, column: e.target.value })}
          />
        </div>
      </div>
    );
  }

  if (persistenceType === 'auth') {
    const current =
      (target as { auth_field: string } | null) ?? { auth_field: 'email' };
    return (
      <div className="space-y-1.5">
        <Label>{t('persistenceTargetAuthField')}</Label>
        <Select
          value={current.auth_field}
          onValueChange={(v) => {
            if (v == null) return;
            onChange({ auth_field: v as (typeof AUTH_FIELDS)[number] });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AUTH_FIELDS.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (persistenceType === 'survey') {
    const current =
      (target as { survey_question_key: string } | null) ?? {
        survey_question_key: '',
      };
    return (
      <div className="space-y-1.5">
        <Label>{t('persistenceTargetSurveyKey')}</Label>
        <Input
          value={current.survey_question_key}
          onChange={(e) => onChange({ survey_question_key: e.target.value })}
        />
      </div>
    );
  }

  if (persistenceType === 'subtype') {
    const current =
      (target as { subtype_group: string } | null) ?? { subtype_group: '' };
    return (
      <div className="space-y-1.5">
        <Label>{t('persistenceTargetSubtypeGroup')}</Label>
        {subtypeGroups.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No hay grupos de subtypes definidos. Creá uno en /admin/subtypes.
          </p>
        ) : (
          <Select
            value={current.subtype_group}
            onValueChange={(v) => {
              if (v == null) return;
              onChange({ subtype_group: v });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccioná un grupo" />
            </SelectTrigger>
            <SelectContent>
              {subtypeGroups.map((g) => (
                <SelectItem key={g.slug} value={g.slug}>
                  {g.name}{' '}
                  <span className="text-muted-foreground text-xs">({g.slug})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );
  }

  // form_response, service_select → null target
  return null;
}
