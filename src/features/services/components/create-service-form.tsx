'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/lib/i18n/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createService } from '../actions/create-service';

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function CreateServiceForm() {
  const t = useTranslations('AdminServices');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugEdited) setSlug(toSlug(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createService({
        slug,
        translation: { locale: 'es', name },
      });
      if ('error' in result && result.error) {
        const msg = Object.values(result.error).flat().join(', ');
        setError(msg);
        return;
      }
      if ('data' in result && result.data) {
        toast.success(tc('createdSuccess'));
        router.push(`/admin/services/${result.data.id}`);
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
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? t('saving') : t('createService')}
      </Button>
    </form>
  );
}
