'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Users } from 'lucide-react';
import { createTeam } from '../actions/create-team';

export function CreateTeamSheet() {
  const t = useTranslations('AdminMembers');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createTeam({ name });
      if ('error' in result) {
        const msg = Object.values(result.error).flat().join(', ');
        setError(msg);
        return;
      }
      toast.success(t('teamCreated'));
      setName('');
      setError(null);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setName(''); setError(null); } }}>
      <SheetTrigger render={
        <Button variant="outline" size="sm">
          <Users className="mr-1 h-3 w-3" />
          {t('createTeam')}
        </Button>
      } />
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{t('createTeam')}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="space-y-2">
            <Label>{t('teamName')} *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? t('creating') : t('createTeam')}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
