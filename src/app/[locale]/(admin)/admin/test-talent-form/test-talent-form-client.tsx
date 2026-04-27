'use client';

import { useEffect, useState, useTransition } from 'react';
import { Label } from '@/components/ui/label';
import { getResolvedEmbeddableForm } from '@/features/general-forms/actions/get-resolved-embeddable-form';
import { RegistrationFormEmbedRenderer } from '@/features/general-forms/components/registration-form-embed-renderer';
import type { RegistrationFormListItem } from '@/features/general-forms/types';
import type { ResolvedForm } from '@/shared/lib/field-catalog/resolved-types';

type CountryOption = { id: string; name: string };
type CityOption = { id: string; name: string; country_id: string };

type Props = {
  locale: string;
  countries: CountryOption[];
  cities: CityOption[];
  registrationForms: RegistrationFormListItem[];
};

export function TestTalentFormClient({ locale, countries, cities, registrationForms }: Props) {
  const [selectedSlug, setSelectedSlug] = useState('');
  const [countryId, setCountryId] = useState('');
  const [cityId, setCityId] = useState('');
  const [form, setForm] = useState<{
    resolvedForm: ResolvedForm;
    targetRole: 'talent' | 'client';
  } | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'unavailable'>('idle');
  const [isPending, startTransition] = useTransition();

  const filteredCities = cities.filter((c) => c.country_id === countryId);

  useEffect(() => {
    setCountryId('');
    setCityId('');
    setForm(null);
    setStatus('idle');
  }, [selectedSlug]);

  useEffect(() => {
    setCityId('');
    setForm(null);
    setStatus('idle');
  }, [countryId]);

  useEffect(() => {
    if (!selectedSlug || !cityId) {
      setForm(null);
      setStatus('idle');
      return;
    }

    setStatus('loading');
    startTransition(async () => {
      const result = await getResolvedEmbeddableForm(selectedSlug, cityId, locale);
      if (result.available) {
        setForm({
          resolvedForm: result.resolvedForm,
          targetRole: result.meta.targetRole,
        });
        setStatus('loaded');
      } else {
        setForm(null);
        setStatus('unavailable');
      }
    });
  }, [selectedSlug, cityId, locale]);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    // eslint-disable-next-line no-console
    console.log('[TEST] Form submitted:', formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <div className="w-64 space-y-1">
          <Label className="text-xs">Formulario</Label>
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="border-border bg-background h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="">Seleccionar formulario...</option>
            {registrationForms.map((f) => (
              <option key={f.id} value={f.slug}>
                {f.name} ({f.variant_count} variantes)
              </option>
            ))}
          </select>
        </div>

        <div className="w-64 space-y-1">
          <Label className="text-xs">País</Label>
          <select
            value={countryId}
            onChange={(e) => setCountryId(e.target.value)}
            disabled={!selectedSlug}
            className="border-border bg-background h-9 w-full rounded-md border px-3 text-sm disabled:opacity-50"
          >
            <option value="">Seleccionar país...</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="w-64 space-y-1">
          <Label className="text-xs">Ciudad</Label>
          <select
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            disabled={!countryId}
            className="border-border bg-background h-9 w-full rounded-md border px-3 text-sm disabled:opacity-50"
          >
            <option value="">Seleccionar ciudad...</option>
            {filteredCities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {status === 'idle' && (
        <p className="text-muted-foreground text-sm">
          Selecciona un formulario, país y ciudad para ver el formulario.
        </p>
      )}

      {(status === 'loading' || isPending) && (
        <p className="text-muted-foreground text-sm">Cargando formulario...</p>
      )}

      {status === 'unavailable' && !isPending && (
        <div className="rounded-md border border-dashed p-6 text-center">
          <p className="text-muted-foreground">
            Formulario no disponible en esta ciudad.
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Slug: {selectedSlug} — Ciudad ID: {cityId}
          </p>
        </div>
      )}

      {status === 'loaded' && form && !isPending && (
        <div className="max-w-lg rounded-md border p-6">
          <RegistrationFormEmbedRenderer
            resolvedForm={form.resolvedForm}
            targetRole={form.targetRole}
            onSubmit={handleSubmit}
            countryId={countryId}
            cityId={cityId}
          />
        </div>
      )}
    </div>
  );
}
