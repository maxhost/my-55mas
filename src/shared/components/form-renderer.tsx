'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import type {
  ResolvedAction,
  ResolvedForm,
  ResolvedField,
  ResolvedStep,
} from '@/shared/lib/field-catalog/resolved-types';
import { renderResolvedField } from './field-renderers';

// ── Types ────────────────────────────────────────────

export type SubmitMeta = {
  action: 'save' | 'register';
  redirect_url?: string;
  isLastStep: boolean;
};

// FieldSlot: contenido a renderear inmediatamente debajo de un field
// específico (matched por stepKey + fieldKey). Útil para inyectar UI
// que coexiste con el field y necesita su valor live (callback variant).
//
// - ReactNode: contenido estático (típicamente Server Components
//   pre-renderizados pasados desde una page).
// - Callback: recibe el valor live del field y el formData completo del
//   FormRenderer. Útil para componentes que necesitan reaccionar al
//   estado actual del form (ej: botón "Aplicar selección").
export type FieldSlot =
  | ReactNode
  | ((ctx: { value: unknown; data: Record<string, unknown> }) => ReactNode);

// FieldSlots: scoped por stepKey para evitar colisión cuando un mismo
// field_definition_id se reusa en múltiples forms con keys idénticas.
export type FieldSlots = Record<string /* stepKey */, Record<string /* fieldKey */, FieldSlot>>;

// ActionGuard: predicate que se evalúa antes de avanzar/submit de un
// step. Retorna `true` si el step puede avanzar, o un string con el
// mensaje de error a mostrar inline (UX) y bloquear el avance.
export type ActionGuard = () => true | string;

type Props = {
  form: ResolvedForm;
  onSubmit: (
    formData: Record<string, unknown>,
    meta?: SubmitMeta
  ) => void | Promise<boolean>;
  submitLabel?: string;
  isPending?: boolean;
  selectPlaceholder?: string;
  // Slots opcionales scoped por stepKey + fieldKey. Si un slot existe
  // para el field renderizado, se renderea inmediatamente debajo del field.
  fieldSlots?: FieldSlots;
  // Guards opcionales scoped por stepKey. Se evalúan antes de avanzar/
  // submit. Si retornan string, el avance se bloquea y el mensaje se
  // muestra inline.
  actionGuards?: Record<string /* stepKey */, ActionGuard>;
};

function buildInitialData(form: ResolvedForm): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const step of form.steps) {
    for (const field of step.fields) {
      if (field.current_value !== undefined) {
        data[field.key] = field.current_value;
      }
    }
  }
  return data;
}

function isRequiredEmpty(field: ResolvedField, value: unknown): boolean {
  if (!field.required) return false;
  // Fields presentacionales (display_text, persistence='none') no capturan
  // valor — required en ellos es un no-op. Coherente con validateRequired
  // del server (persist-form-data).
  if (field.persistence_type === 'none') return false;
  // terms_checkbox: "no aceptado" (undefined, false) bloquea. Solo true vale.
  if (field.input_type === 'terms_checkbox') return value !== true;
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

// ── Component ────────────────────────────────────────

export function FormRenderer({
  form,
  onSubmit,
  submitLabel,
  isPending = false,
  selectPlaceholder = '',
  fieldSlots,
  actionGuards,
}: Props) {
  const [data, setData] = useState<Record<string, unknown>>(() =>
    buildInitialData(form)
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [guardError, setGuardError] = useState<string | null>(null);
  // customErrors: errores custom impuestos por renderers vía
  // `setFieldError(message)`. Se chequean en validateStep para bloquear
  // avance si el renderer marca el field como inválido. Reusable para
  // cualquier input_type que necesite reglas más allá de "required".
  const [customErrors, setCustomErrors] = useState<Map<string, string>>(
    () => new Map()
  );

  // Callback estable que el renderer usa para imponer/limpiar un error.
  // useCallback para evitar re-renders innecesarios del renderer Client.
  const makeSetFieldError = useCallback(
    (fieldKey: string) => (message: string | null) => {
      setCustomErrors((prev) => {
        const next = new Map(prev);
        if (message === null || message === '') {
          if (!next.has(fieldKey)) return prev;
          next.delete(fieldKey);
        } else {
          if (next.get(fieldKey) === message) return prev;
          next.set(fieldKey, message);
        }
        return next;
      });
    },
    []
  );

  const renderFieldSlot = (stepKey: string, fieldKey: string): ReactNode => {
    const slot = fieldSlots?.[stepKey]?.[fieldKey];
    if (slot === undefined) return null;
    if (typeof slot === 'function') {
      return slot({ value: data[fieldKey], data });
    }
    return slot;
  };

  const { steps } = form;
  const isWizard = steps.some((s) => s.actions && s.actions.length > 0);

  const setValue = (key: string, value: unknown) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const validateStep = (step: ResolvedStep): boolean => {
    const missing = new Set<string>();
    for (const field of step.fields) {
      // Required check.
      if (isRequiredEmpty(field, data[field.key])) {
        missing.add(field.key);
        continue;
      }
      // Custom error check: si el renderer impuso un error vía
      // setFieldError, también bloquea avance.
      if (customErrors.has(field.key)) {
        missing.add(field.key);
      }
    }
    setErrors(missing);
    return missing.size === 0;
  };

  const handleAction = async (action: ResolvedAction) => {
    setGuardError(null);
    if (action.type === 'back') {
      setStepIndex((i) => Math.max(0, i - 1));
      setErrors(new Set());
      return;
    }
    const currentStep = steps[stepIndex];
    if (!validateStep(currentStep)) return;
    // ActionGuard: se evalúa post-required-validation, antes de avanzar.
    // Aplica a next/submit/register (no a back). Si retorna string, mostrar
    // mensaje inline y bloquear el avance.
    const guard = actionGuards?.[currentStep.key];
    if (guard) {
      const guardResult = guard();
      if (typeof guardResult === 'string') {
        setGuardError(guardResult);
        return;
      }
    }
    if (action.type === 'next') {
      setStepIndex((i) => Math.min(steps.length - 1, i + 1));
      return;
    }
    const isLastStep = stepIndex >= steps.length - 1;
    const meta: SubmitMeta = {
      action: action.type === 'register' ? 'register' : 'save',
      redirect_url: action.redirect_url,
      isLastStep,
    };
    const result = await onSubmit(data, meta);
    if (result === true && !isLastStep) {
      setStepIndex((i) => Math.min(steps.length - 1, i + 1));
    }
  };

  const renderStep = (step: ResolvedStep) => (
    <div key={step.key} className="space-y-4">
      <h3 className="text-lg font-medium">{step.label}</h3>
      {step.fields.map((field) => {
        const slot = renderFieldSlot(step.key, field.key);
        const customError = customErrors.get(field.key);
        const hasError = errors.has(field.key) || Boolean(customError);
        const fieldNode = renderResolvedField(
          field,
          data[field.key],
          hasError ? 'border-destructive' : '',
          setValue,
          selectPlaceholder,
          makeSetFieldError(field.key),
          customError
        );
        // Render mensaje del custom error inline debajo del field si existe.
        // Built-ins ignoran customError y el FormRenderer lo muestra acá
        // para que cualquier renderer reciba la misma UX sin duplicar.
        const errorMsg = customError ? (
          <p className="text-destructive text-xs">{customError}</p>
        ) : null;
        if (slot === null && errorMsg === null) return fieldNode;
        return (
          <div key={field.key} className="space-y-3">
            {fieldNode}
            {errorMsg}
            {slot}
          </div>
        );
      })}
    </div>
  );

  const renderActions = (actions: ResolvedAction[]) => (
    <div className="flex justify-end gap-2">
      {actions.map((action) => {
        const isBack = action.type === 'back';
        return (
          <Button
            key={action.key}
            variant={isBack ? 'ghost' : 'default'}
            onClick={() => handleAction(action)}
            disabled={isPending && !isBack}
          >
            {action.label}
          </Button>
        );
      })}
    </div>
  );

  if (isWizard) {
    const currentStep = steps[stepIndex];
    const actions: ResolvedAction[] =
      currentStep.actions ??
      (stepIndex < steps.length - 1
        ? [{ key: 'btn_next', type: 'next', label: 'Next' }]
        : [{ key: 'btn_submit', type: 'submit', label: 'Submit' }]);

    return (
      <div className="space-y-6">
        <p className="text-muted-foreground text-sm">
          {stepIndex + 1} / {steps.length}
        </p>
        {renderStep(currentStep)}
        {guardError && (
          <p className="text-destructive bg-destructive/10 rounded-md px-3 py-2 text-sm">
            {guardError}
          </p>
        )}
        {renderActions(actions)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {steps.map(renderStep)}
      <Button
        onClick={() => {
          const missing = new Set<string>();
          for (const step of steps) {
            for (const field of step.fields) {
              if (isRequiredEmpty(field, data[field.key])) missing.add(field.key);
            }
          }
          if (missing.size > 0) {
            setErrors(missing);
            return;
          }
          void onSubmit(data);
        }}
        disabled={isPending}
      >
        {submitLabel ?? 'Submit'}
      </Button>
    </div>
  );
}
