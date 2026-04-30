'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { commitTalentServiceSelection } from '../actions/commit-talent-service-selection';

type Props = {
  // Selección actual del field (live, viene del FormRenderer's data state).
  // El FormRenderer expone esto via slot callback: ({ value }) => <Committer ... />.
  currentSelection: string[];
  // Selección persistida en talent_services (snapshot del último commit).
  // Pasada desde la page Server Component.
  persistedSelection: string[];
  // Callback opcional invocado tras commit success. Útil para que un
  // parent renderer (ej: TalentServicesPanel) dispare un re-fetch de su
  // estado local. router.refresh() solo no garantiza re-fetch del state
  // de un Client component (no re-corre useEffect estable).
  onCommitSuccess?: () => void;
};

// Botón "Aplicar selección". Visible solo cuando hay diff entre la
// selección actual del multiselect y la persistida en talent_services.
//
// Click → server action commitTalentServiceSelection (defense-in-depth
// + adapter idempotente diff-based) → router.refresh() para que el
// accordion vecino re-renderee con la nueva lista.
//
// El adapter en S1 es idempotente: si por algún motivo se commitea con
// la misma selección persistida (race), no destruye form_data.
export function TalentServiceSelectionCommitter({
  currentSelection,
  persistedSelection,
  onCommitSuccess,
}: Props) {
  const t = useTranslations('OnboardingServices');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sortedCurrent = [...currentSelection].sort();
  const sortedPersisted = [...persistedSelection].sort();
  const hasDiff =
    sortedCurrent.length !== sortedPersisted.length ||
    sortedCurrent.some((id, i) => id !== sortedPersisted[i]);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await commitTalentServiceSelection({
        serviceIds: currentSelection,
      });
      if ('error' in result && result.error) {
        const firstMsg = Object.values(result.error).flat().filter(Boolean)[0];
        const msg = firstMsg ?? t('commitError');
        setError(msg);
        toast.error(t('commitError'));
        return;
      }
      toast.success(t('commitSuccess'));
      router.refresh();
      onCommitSuccess?.();
    });
  };

  return (
    <div className="space-y-2">
      {hasDiff && !isPending && (
        <p className="text-muted-foreground text-xs">{t('commitPending')}</p>
      )}
      {error && (
        <p className="text-destructive text-xs">{error}</p>
      )}
      <Button
        type="button"
        size="sm"
        onClick={handleClick}
        disabled={!hasDiff || isPending}
      >
        {isPending ? t('commitInFlight') : t('commitSelection')}
      </Button>
    </div>
  );
}
