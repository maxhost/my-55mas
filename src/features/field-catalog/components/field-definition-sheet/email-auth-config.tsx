'use client';

import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type Props = {
  allowChange: boolean;
  onAllowChangeChange: (value: boolean) => void;
};

// Configuración específica de input_type='email' + persistence_type='auth'.
// El único toggle es `allow_change`: cuando false (default), el campo se
// pre-llena con el email del usuario logueado y queda readOnly; cuando
// true, el usuario puede editarlo y al confirmar el cambio se dispara
// supabase.auth.updateUser (envío de enlace de confirmación).
// Los textos del modal de confirmación se setean per-locale en las
// traducciones (modal_title / modal_body) — ver FieldTranslationTabs.
export function EmailAuthConfig({
  allowChange,
  onAllowChangeChange,
}: Props) {
  const t = useTranslations('AdminFieldCatalog');
  return (
    <div className="space-y-2 rounded-md border border-dashed p-3">
      <div className="flex items-start gap-2">
        <Checkbox
          id="email-allow-change"
          checked={allowChange}
          onCheckedChange={(v) => onAllowChangeChange(v === true)}
          className="mt-0.5"
        />
        <div className="space-y-1">
          <Label htmlFor="email-allow-change" className="cursor-pointer">
            {t('emailAllowChange')}
          </Label>
          <p className="text-muted-foreground text-xs">
            {t('emailAllowChangeHint')}
          </p>
        </div>
      </div>
    </div>
  );
}
