'use client';

import { useEffect, useState, useTransition, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  renderMultiselectDropdown,
  type RenderProps,
} from '@/shared/components/field-renderers';
import type { ResolvedField } from '@/shared/lib/field-catalog/resolved-types';
import { loadTalentServicesPanelState } from '../../actions/load-talent-services-panel-state';
import {
  loadTalentServiceForExpand,
  type TalentServiceExpandResult,
} from '../../actions/load-talent-service-for-expand';
import type { TalentServiceStatusItem } from '../../actions/get-talent-services-status';
import type { AvailableService } from '../../actions/load-talent-services-panel-state';
import { TalentServiceSelectionCommitter } from '../talent-service-selection-committer';
import { TalentServiceFormEmbedRenderer } from '../talent-service-form-embed-renderer';

// Composite input_type: multiselect filtrado por country+city+published +
// committer + acordeón con embeds lazy + status badges + bloqueo del
// submit del step (vía setFieldError).
//
// Identidad y context country+city resueltos server-side dentro de
// loadTalentServicesPanelState. El renderer es Client puro — invoca
// server actions, NO accede a Supabase directamente.
//
// Side-effect: al primer render dispara load del state del panel. Tras
// commit del committer, refetchKey se incrementa y dispara re-fetch.
export function TalentServicesPanel(props: RenderProps) {
  const { field, value, onChange, setFieldError } = props;
  const tEmbed = useTranslations('OnboardingServices');
  const locale = useLocale();
  const [refetchKey, setRefetchKey] = useState(0);
  const [state, setState] = useState<{
    loading: boolean;
    persistedSelection: string[];
    availableServices: AvailableService[];
    services: TalentServiceStatusItem[];
    saved: number;
    total: number;
    error: string | null;
  }>({
    loading: true,
    persistedSelection: [],
    availableServices: [],
    services: [],
    saved: 0,
    total: 0,
    error: null,
  });

  // Fetch state del panel. Re-corre cuando refetchKey cambia (post-commit
  // o post-submit individual de un embed).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await loadTalentServicesPanelState(locale);
      if (cancelled) return;
      if (!result.ok) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: result.reason,
        }));
        return;
      }
      setState({
        loading: false,
        persistedSelection: result.persistedSelection,
        availableServices: result.availableServices,
        services: result.services,
        saved: result.saved,
        total: result.total,
        error: null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [locale, refetchKey]);

  // setFieldError reactivo a saved/total: bloquea avance del step si
  // total === 0 o saved < total. Limpia cuando OK.
  useEffect(() => {
    if (!setFieldError) return;
    if (state.loading || state.error) return;
    if (state.total === 0) {
      setFieldError(tEmbed('atLeastOneService'));
    } else if (state.saved < state.total) {
      setFieldError(tEmbed('saveAllServicesFirst'));
    } else {
      setFieldError(null);
    }
  }, [setFieldError, state, tEmbed]);

  const triggerRefetch = useCallback(() => {
    setRefetchKey((k) => k + 1);
  }, []);

  if (state.loading) {
    return (
      <div className="space-y-2">
        <Label>{field.label}</Label>
        <div className="border-border h-9 animate-pulse rounded-md bg-muted/40" />
        <p className="text-muted-foreground text-xs">{tEmbed('commitInFlight')}</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="rounded-md border border-dashed p-4">
        <p className="text-muted-foreground text-sm">
          {tEmbed('emptyState')}
        </p>
      </div>
    );
  }

  // Inyectamos availableServices como override de field.options. El
  // multiselect built-in lee field.options + field.option_labels. Como
  // ResolvedField es objeto pasado por referencia, hacemos una copia.
  const overrideField: ResolvedField = {
    ...field,
    options: state.availableServices.map((s) => s.id),
    option_labels: Object.fromEntries(
      state.availableServices.map((s) => [s.id, s.name])
    ),
  };
  const currentSelection = Array.isArray(value) ? (value as string[]) : [];

  return (
    <div className="space-y-4">
      {renderMultiselectDropdown({
        field: overrideField,
        value: currentSelection,
        errorClass: '',
        onChange,
        selectPlaceholder: '',
      })}

      <TalentServiceSelectionCommitter
        currentSelection={currentSelection}
        persistedSelection={state.persistedSelection}
        onCommitSuccess={triggerRefetch}
      />

      {state.services.length === 0 ? (
        <p className="text-muted-foreground text-sm">{tEmbed('emptyState')}</p>
      ) : (
        <>
          <p className="text-muted-foreground text-xs">
            {tEmbed('savedCount', {
              saved: state.saved,
              total: state.total,
            })}
          </p>
          <ul className="space-y-2">
            {state.services.map((item) => (
              <PanelAccordionItem
                key={`${item.serviceId}:${refetchKey}`}
                item={item}
                onSubmittedItem={triggerRefetch}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// Item del acordeón. Lazy-fetch del resolved form on first expand.
// Cache local: si ya cargó, no re-fetch al colapsar/expandir. El
// `refetchKey` del parent se aplica vía la `key` prop, lo cual remountea
// el item tras commit (state idle de nuevo).
function PanelAccordionItem({
  item,
  onSubmittedItem,
}: {
  item: TalentServiceStatusItem;
  onSubmittedItem: () => void;
}) {
  const t = useTranslations('OnboardingServices');
  const locale = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [embedState, setEmbedState] = useState<{
    status: 'idle' | 'loading' | 'loaded' | 'error';
    embed: TalentServiceExpandResult & { ok: true } | null;
  }>({ status: 'idle', embed: null });

  const fetchEmbed = useCallback(() => {
    setEmbedState({ status: 'loading', embed: null });
    startTransition(async () => {
      const result = await loadTalentServiceForExpand({ slug: item.slug }, locale);
      if (!result.ok) {
        setEmbedState({ status: 'error', embed: null });
        return;
      }
      setEmbedState({ status: 'loaded', embed: result });
    });
  }, [item.slug, locale]);

  const onToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const open = (e.currentTarget as HTMLDetailsElement).open;
    if (open && embedState.status === 'idle') {
      fetchEmbed();
    }
  };

  const onEmbedSubmit = useCallback(() => {
    router.refresh();
    onSubmittedItem();
  }, [router, onSubmittedItem]);

  return (
    <li className="rounded-md border">
      <details className="group" onToggle={onToggle}>
        <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/40">
          <span className="font-medium">{item.label}</span>
          <span
            className={
              item.hasFormData
                ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800'
                : 'rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800'
            }
          >
            {item.hasFormData
              ? `${t('statusSaved')} ✓`
              : t('statusPending')}
          </span>
        </summary>
        <div className="border-t p-4">
          {embedState.status === 'loading' && (
            <p className="text-muted-foreground text-sm">
              {t('loadingService')}
            </p>
          )}
          {embedState.status === 'error' && (
            <div className="space-y-2">
              <p className="text-destructive text-sm">{t('expandError')}</p>
              <Button type="button" size="sm" onClick={fetchEmbed}>
                {t('retry')}
              </Button>
            </div>
          )}
          {embedState.status === 'loaded' && embedState.embed && (
            <TalentServiceFormEmbedRenderer
              serviceId={embedState.embed.serviceId}
              formId={embedState.embed.formId}
              resolvedForm={embedState.embed.resolvedForm}
              onSubmit={onEmbedSubmit}
            />
          )}
        </div>
      </details>
    </li>
  );
}
