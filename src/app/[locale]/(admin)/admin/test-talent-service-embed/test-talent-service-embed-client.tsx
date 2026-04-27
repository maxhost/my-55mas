'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type ServiceOption = { slug: string };
type CountryOption = { id: string; name: string };

type Props = {
  locale: string;
  services: ServiceOption[];
  countries: CountryOption[];
};

// Client harness: selectors de service slug + siteCountryId. Al hacer
// "Probar" navega a la misma URL con searchParams; la page (Server
// Component) los lee y renderiza el embed.
export function TestTalentServiceEmbedClient({
  locale,
  services,
  countries,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [slug, setSlug] = useState(params.get('slug') ?? '');
  const [countryId, setCountryId] = useState(params.get('country') ?? '');

  const apply = () => {
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set('slug', slug);
    else url.searchParams.delete('slug');
    if (countryId) url.searchParams.set('country', countryId);
    else url.searchParams.delete('country');
    router.push(url.pathname + url.search);
    router.refresh();
  };

  const clear = () => {
    setSlug('');
    setCountryId('');
    router.push(`/${locale}/admin/test-talent-service-embed`);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <div className="w-64 space-y-1">
          <Label className="text-xs">Service slug</Label>
          <select
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="border-border bg-background h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="">Seleccionar servicio…</option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.slug}
              </option>
            ))}
          </select>
        </div>

        <div className="w-64 space-y-1">
          <Label className="text-xs">siteCountryId</Label>
          <select
            value={countryId}
            onChange={(e) => setCountryId(e.target.value)}
            className="border-border bg-background h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="">Seleccionar país…</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <Button onClick={apply} disabled={!slug || !countryId}>
            Probar
          </Button>
          <Button variant="ghost" onClick={clear}>
            Limpiar
          </Button>
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        Locale activa: <code>{locale}</code>. La identidad del talent y
        su country/city se resuelven server-side desde tu sesión.
      </p>
    </div>
  );
}
