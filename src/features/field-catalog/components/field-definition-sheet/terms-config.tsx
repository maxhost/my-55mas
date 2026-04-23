'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  tosUrl: string;
  privacyUrl: string;
  onTosUrlChange: (value: string) => void;
  onPrivacyUrlChange: (value: string) => void;
};

// Bloque de configuración específico de terms_checkbox: 2 URL inputs
// globales (no traducibles). Se persisten en field.config como
// { tos_url, privacy_url } al guardar.
export function TermsCheckboxConfig({
  tosUrl,
  privacyUrl,
  onTosUrlChange,
  onPrivacyUrlChange,
}: Props) {
  const t = useTranslations('AdminFieldCatalog');
  return (
    <div className="space-y-3 rounded-md border border-dashed p-3">
      <p className="text-muted-foreground text-xs">{t('termsConfigHint')}</p>
      <div className="space-y-2">
        <Label>{t('termsTosUrl')}</Label>
        <Input
          type="url"
          value={tosUrl}
          onChange={(e) => onTosUrlChange(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="space-y-2">
        <Label>{t('termsPrivacyUrl')}</Label>
        <Input
          type="url"
          value={privacyUrl}
          onChange={(e) => onPrivacyUrlChange(e.target.value)}
          placeholder="https://..."
        />
      </div>
    </div>
  );
}
