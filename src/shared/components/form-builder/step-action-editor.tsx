'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { STEP_ACTION_TYPES, type StepAction } from '@/shared/lib/forms/types';

type Props = {
  actions: StepAction[];
  stepIndex: number;
  stepKey: string;
  translations: { labels: Record<string, string> };
  onChange: (actions: StepAction[]) => void;
  onLabelChange: (key: string, value: string) => void;
};

export function StepActionEditor({
  actions,
  stepIndex,
  stepKey,
  translations,
  onChange,
  onLabelChange,
}: Props) {
  const t = useTranslations('AdminFormBuilder');

  const hasSubmitType = actions.some((a) => a.type === 'submit' || a.type === 'register');

  const addAction = () => {
    const existingKeys = new Set(actions.map((a) => a.key));
    let idx = actions.length + 1;
    while (existingKeys.has(`${stepKey}_btn_${idx}`)) idx++;
    const newAction: StepAction = { key: `${stepKey}_btn_${idx}`, type: 'next' };
    onChange([...actions, newAction]);
  };

  const updateAction = (i: number, patch: Partial<StepAction>) => {
    onChange(actions.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  };

  const removeAction = (i: number) => {
    onChange(actions.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">{t('actions')}</Label>

      {actions.map((action, i) => {
        const showRedirect = action.type === 'submit' || action.type === 'register';
        return (
          <div key={i} className="bg-muted/50 space-y-2 rounded-md border p-2">
            <div className="flex items-center gap-2">
              {/* Key (read-only) */}
              <span className="text-muted-foreground rounded bg-muted px-2 py-0.5 font-mono text-xs">
                {action.key}
              </span>

              {/* Type selector */}
              <select
                value={action.type}
                onChange={(e) => {
                  const type = e.target.value as StepAction['type'];
                  const patch: Partial<StepAction> = { type };
                  if (type !== 'submit' && type !== 'register') {
                    patch.redirect_url = undefined;
                  }
                  updateAction(i, patch);
                }}
                className="border-border bg-background h-7 rounded-md border px-2 text-xs"
              >
                {STEP_ACTION_TYPES.map((type) => {
                  const disabled =
                    (type === 'back' && stepIndex === 0) ||
                    ((type === 'submit' || type === 'register') && hasSubmitType && action.type !== 'submit' && action.type !== 'register');
                  return (
                    <option key={type} value={type} disabled={disabled}>
                      {t(`action_${type}`)}
                    </option>
                  );
                })}
              </select>

              {/* Remove */}
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeAction(i)}>
                <X className="size-3" />
              </Button>
            </div>

            {/* Label translation */}
            <Input
              value={translations.labels[action.key] ?? ''}
              onChange={(e) => onLabelChange(action.key, e.target.value)}
              placeholder={t('actionLabel')}
              className="h-7 text-xs"
            />

            {/* Redirect URL (only for submit/register) */}
            {showRedirect && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!action.redirect_url}
                    onChange={(e) =>
                      updateAction(i, { redirect_url: e.target.checked ? '/' : undefined })
                    }
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-xs">{t('redirectToggle')}</span>
                </div>
                {action.redirect_url !== undefined && (
                  <Input
                    value={action.redirect_url}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateAction(i, { redirect_url: val.startsWith('/') ? val : `/${val}` });
                    }}
                    placeholder={t('redirectHint')}
                    className="h-7 text-xs"
                  />
                )}
              </div>
            )}
          </div>
        );
      })}

      <Button type="button" variant="outline" size="sm" onClick={addAction}>
        <Plus className="mr-1 h-3 w-3" />
        {t('addAction')}
      </Button>
    </div>
  );
}
