'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/lib/i18n/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createRegistrationForm } from '../actions/create-registration-form';

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function CreateRegistrationForm() {
  const t = useTranslations('AdminForms');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [targetRole, setTargetRole] = useState<'talent' | 'client'>('talent');
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugEdited) setSlug(toSlug(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createRegistrationForm({ name, slug, target_role: targetRole });
      if ('error' in result && result.error) {
        const msg = Object.values(result.error).flat().join(', ');
        setError(msg);
        return;
      }
      if ('id' in result) {
        toast.success(tc('createdSuccess'));
        router.push(`/admin/forms/${result.id}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label>{t('name')} *</Label>
        <Input
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>{t('slug')}</Label>
        <Input
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugEdited(true);
          }}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>{t('targetRole')}</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="target_role"
              value="talent"
              checked={targetRole === 'talent'}
              onChange={() => setTargetRole('talent')}
              className="h-4 w-4"
            />
            {t('targetRoleTalent')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="target_role"
              value="client"
              checked={targetRole === 'client'}
              onChange={() => setTargetRole('client')}
              className="h-4 w-4"
            />
            {t('targetRoleClient')}
          </label>
        </div>
        <p className="text-muted-foreground text-xs">{t('targetRoleHelp')}</p>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? t('saving') : t('createForm')}
      </Button>
    </form>
  );
}
