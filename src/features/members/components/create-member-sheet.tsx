'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Plus } from 'lucide-react';
import { createMember } from '../actions/create-member';
import type { CountryOption, CityOption, TeamOption, RoleOption } from '../types';

type Props = {
  countryOptions: CountryOption[];
  cityOptions: CityOption[];
  teamOptions: TeamOption[];
  roleOptions: RoleOption[];
};

export function CreateMemberSheet({
  countryOptions,
  cityOptions,
  teamOptions,
  roleOptions,
}: Props) {
  const t = useTranslations('AdminMembers');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('');
  const [countryId, setCountryId] = useState<string>('');
  const [cityId, setCityId] = useState<string>('');
  const [teamId, setTeamId] = useState<string>('');

  const filteredCities = countryId
    ? cityOptions.filter((c) => c.country_id === countryId)
    : [];

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setRole('');
    setCountryId('');
    setCityId('');
    setTeamId('');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createMember({
        first_name: firstName,
        last_name: lastName,
        email,
        role: role as 'admin' | 'manager' | 'viewer',
        country_id: countryId || null,
        city_id: cityId || null,
        team_id: teamId || null,
      });
      if ('error' in result) {
        const msg = Object.values(result.error).flat().join(', ');
        setError(msg);
        return;
      }
      toast.success(t('memberCreated'));
      resetForm();
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <SheetTrigger render={
        <Button variant="default" size="sm">
          <Plus className="mr-1 h-3 w-3" />
          {t('createMember')}
        </Button>
      } />
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('createMember')}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="space-y-2">
            <Label>{t('firstName')} *</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>{t('lastName')} *</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>{t('email')} *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>{t('memberRole')} *</Label>
            <Select value={role} onValueChange={(val) => { setRole(val ?? ''); if (val === 'admin') { setCountryId(''); setCityId(''); } }}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectRole')} />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((r) => (
                  <SelectItem key={r.key} value={r.key}>{r.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {role && role !== 'admin' && (
            <>
              <div className="space-y-2">
                <Label>{t('country')} *</Label>
                <Select value={countryId} onValueChange={(val) => { setCountryId(val ?? ''); setCityId(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectCountry')}>
                      {countryOptions.find((c) => c.id === countryId)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('city')}</Label>
                <Select value={cityId} onValueChange={(val) => setCityId(val ?? '')} disabled={!countryId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectCity')}>
                      {filteredCities.find((c) => c.id === cityId)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label>{t('team')}</Label>
            <Select value={teamId} onValueChange={(val) => setTeamId(val ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectTeam')}>
                  {teamOptions.find((o) => o.id === teamId)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {teamOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" disabled={isPending || !role} className="w-full">
            {isPending ? t('creating') : t('createMember')}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
