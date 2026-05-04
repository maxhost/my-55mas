'use client';

import { useEffect, useState, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AddressAutocomplete,
  emptyAddress,
  type AddressValue,
} from '@/shared/components/address-autocomplete';
import { saveContactAddress } from '../../actions/save-contact-address';
import {
  PREFERRED_CONTACT_VALUES,
  type ContactAddress,
  type PreferredContact,
} from '../../types';

type Hints = {
  title: string;
  preferredContactLabel: string;
  preferredContactWhatsapp: string;
  preferredContactEmail: string;
  preferredContactPhone: string;
  countryLabel: string;
  addressLabel: string;
  addressPlaceholder: string;
  cityLabel: string;
  cityPlaceholder: string;
  /** Hint shown when Mapbox didn't auto-detect a matching DB city. */
  cityNotDetectedHint: string;
  saveAndContinue: string;
  saveAndBackToSummary: string;
  validationError: string;
};

type CityOption = {
  id: string;
  name: string;
  country_id: string;
};

type Props = {
  initial: ContactAddress | null;
  mode: 'wizard' | 'edit';
  onSaved: () => void;
  hints: Hints;
  countryCode: string;
  countryName: string;
  /**
   * Cities for the talent's locked country. Parent (wizard) is expected to
   * filter by country_id before passing — we re-filter defensively.
   */
  cities: CityOption[];
};

type LocalState = {
  preferred_contact: PreferredContact | undefined;
  address: AddressValue;
  city_id: string | null;
};

function normalize(s: string): string {
  // NFD strip + lowercase, mirroring the registration form's matcher.
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

export function ContactAddressStep({
  initial,
  mode,
  onSaved,
  hints,
  countryCode,
  countryName,
  cities,
}: Props) {
  const [state, setState] = useState<LocalState>({
    preferred_contact: initial?.preferred_contact,
    address: initial?.address ?? emptyAddress,
    city_id: initial?.city_id ?? null,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Try to auto-resolve the city when Mapbox returns a city_name we recognize.
  useEffect(() => {
    if (!state.address.city_name || state.city_id) return;
    const target = normalize(state.address.city_name);
    const matched = cities.find((c) => normalize(c.name) === target);
    if (matched) {
      setState((s) => ({ ...s, city_id: matched.id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.address.city_name]);

  const cityNeedsManual =
    Boolean(state.address.city_name) && !state.city_id;

  const submit = () => {
    setError(null);

    if (
      !state.preferred_contact ||
      !state.address.raw_text ||
      !state.city_id
    ) {
      setError(hints.validationError);
      return;
    }

    const payload: ContactAddress = {
      preferred_contact: state.preferred_contact,
      address: state.address,
      city_id: state.city_id,
    };

    startTransition(async () => {
      const result = await saveContactAddress(payload);
      if ('error' in result) {
        setError(result.error.message);
        return;
      }
      onSaved();
    });
  };

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">{hints.title}</h2>

      {/* Preferred contact */}
      <div className="space-y-1.5">
        <Label htmlFor="onboarding-preferred-contact">
          {hints.preferredContactLabel}
        </Label>
        <Select
          value={state.preferred_contact ?? ''}
          onValueChange={(v) => {
            if (!v) return;
            if ((PREFERRED_CONTACT_VALUES as readonly string[]).includes(v)) {
              setState((s) => ({
                ...s,
                preferred_contact: v as PreferredContact,
              }));
            }
          }}
        >
          <SelectTrigger
            id="onboarding-preferred-contact"
            className="w-full"
          >
            <SelectValue placeholder={hints.preferredContactLabel}>
              {(v: string) => {
                if (v === 'whatsapp') return hints.preferredContactWhatsapp;
                if (v === 'email') return hints.preferredContactEmail;
                if (v === 'phone') return hints.preferredContactPhone;
                return hints.preferredContactLabel;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="whatsapp">
              {hints.preferredContactWhatsapp}
            </SelectItem>
            <SelectItem value="email">
              {hints.preferredContactEmail}
            </SelectItem>
            <SelectItem value="phone">
              {hints.preferredContactPhone}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Country (read-only) */}
      <div className="space-y-1.5">
        <Label>{hints.countryLabel}</Label>
        <div>
          <Badge variant="secondary">{countryName}</Badge>
        </div>
      </div>

      {/* Address autocomplete */}
      <div className="space-y-1.5">
        <Label htmlFor="onboarding-address">{hints.addressLabel}</Label>
        <AddressAutocomplete
          id="onboarding-address"
          value={state.address}
          onChange={(next) => {
            // When the address changes, the auto-resolved city may no longer
            // apply — clear city_id so the matching effect can re-derive it.
            setState((s) => ({ ...s, address: next, city_id: null }));
          }}
          countryCodes={[countryCode]}
          placeholder={hints.addressPlaceholder}
        />
      </div>

      {/* City — manual fallback when Mapbox didn't resolve to a known city */}
      <div className="space-y-1.5">
        <Label htmlFor="onboarding-city">{hints.cityLabel}</Label>
        <Select
          value={state.city_id ?? ''}
          onValueChange={(v) =>
            setState((s) => ({ ...s, city_id: v || null }))
          }
        >
          <SelectTrigger id="onboarding-city" className="w-full">
            <SelectValue placeholder={hints.cityPlaceholder}>
              {(v: string) =>
                cities.find((c) => c.id === v)?.name ?? hints.cityPlaceholder
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {cities.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {cityNeedsManual ? (
          <p className="text-muted-foreground text-xs">
            {hints.cityNotDetectedHint}
            {state.address.city_name ? ` (${state.address.city_name})` : null}
          </p>
        ) : null}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button onClick={submit} disabled={isPending} className="w-full">
        {isPending
          ? '…'
          : mode === 'edit'
            ? hints.saveAndBackToSummary
            : hints.saveAndContinue}
      </Button>
    </section>
  );
}
