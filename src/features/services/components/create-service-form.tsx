'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/lib/i18n/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Plus } from 'lucide-react';
import { createService } from '../actions/create-service';

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function CreateServiceSheet() {
  const t = useTranslations('AdminServices');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugEdited) setSlug(toSlug(value));
  };

  const resetForm = () => {
    setName('');
    setSlug('');
    setSlugEdited(false);
    setError(null);
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
        setOpen(false);
        resetForm();
        router.push(`/admin/services/${result.data.id}`);
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <SheetTrigger render={
        <Button variant="default">
          <Plus className="mr-2 h-4 w-4" />
          {t('createService')}
        </Button>
      } />
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{t('createService')}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
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
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? t('saving') : t('createService')}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
