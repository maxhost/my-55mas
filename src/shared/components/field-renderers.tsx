import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { FormField, FormTranslationData, ServiceSelectOption } from '@/shared/lib/forms/types';
import { getColumnDef } from '@/shared/lib/forms/db-column-registry';
import { SurveyFieldRenderer } from './survey-field-renderer';
import type { SurveyQuestionRenderData } from '@/shared/lib/forms/types';

// ── Types ────────────────────────────────────────────

type FieldRenderProps = {
  field: FormField;
  value: unknown;
  label: string;
  placeholder: string;
  errorClass: string;
  isRequired: boolean;
  onChange: (key: string, value: unknown) => void;
};

type SelectRenderProps = FieldRenderProps & {
  optionLabels: Record<string, string>;
  selectPlaceholder: string;
};

type SurveyRenderProps = FieldRenderProps & {
  surveyQuestions?: Record<string, SurveyQuestionRenderData>;
};

type ServiceSelectRenderProps = FieldRenderProps & {
  serviceOptions?: ServiceSelectOption[];
};

// ── Renderers ────────────────────────────────────────

export function renderBoolean({ field, value, label, isRequired, onChange }: FieldRenderProps) {
  return (
    <div key={field.key} className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(field.key, e.target.checked)}
        className="h-4 w-4"
      />
      <Label>{label}{isRequired && ' *'}</Label>
    </div>
  );
}

export function renderMultilineText({ field, value, label, placeholder, errorClass, isRequired, onChange }: FieldRenderProps) {
  return (
    <div key={field.key} className="space-y-1">
      <Label>{label}{isRequired && ' *'}</Label>
      <Textarea
        value={(value as string) ?? ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={errorClass}
      />
    </div>
  );
}

export function renderSingleSelect({ field, value, label, placeholder, errorClass, isRequired, onChange, optionLabels, selectPlaceholder }: SelectRenderProps) {
  return (
    <div key={field.key} className="space-y-1">
      <Label>{label}{isRequired && ' *'}</Label>
      <select
        value={(value as string) ?? ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        className={`border-border bg-background h-9 w-full rounded-md border px-3 text-sm ${errorClass}`}
      >
        <option value="">{placeholder || selectPlaceholder}</option>
        {(field.options ?? []).map((opt) => (
          <option key={opt} value={opt}>
            {optionLabels[`${field.key}.${opt}`] ?? opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export function renderMultiselect({ field, value, label, isRequired, onChange, optionLabels }: SelectRenderProps) {
  const selected = (value as string[]) ?? [];
  const pairs: Array<{ value: string; label: string }> =
    field.options_snapshot && field.options_snapshot.length > 0
      ? field.options_snapshot
      : (field.options ?? []).map((opt) => ({
          value: opt,
          label: optionLabels[`${field.key}.${opt}`] ?? opt,
        }));

  return (
    <div key={field.key} className="space-y-1">
      <Label>{label}{isRequired && ' *'}</Label>
      <div className="flex flex-wrap gap-2">
        {pairs.map((pair) => (
          <label key={pair.value} className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(pair.value)}
              onChange={(e) => {
                const next = e.target.checked
                  ? [...selected, pair.value]
                  : selected.filter((s) => s !== pair.value);
                onChange(field.key, next);
              }}
              className="h-4 w-4"
            />
            {pair.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export function renderSurveyField({ field, value, label, onChange, surveyQuestions }: SurveyRenderProps) {
  const question = surveyQuestions?.[field.survey_question_key ?? ''];
  if (!question) {
    return (
      <div key={field.key} className="space-y-1">
        <Label className="text-muted-foreground">{label}</Label>
        <p className="text-muted-foreground text-xs">Pregunta no disponible</p>
      </div>
    );
  }
  return (
    <div key={field.key}>
      <SurveyFieldRenderer
        question={question}
        value={value}
        onChange={(v) => onChange(field.key, v)}
      />
    </div>
  );
}

export function renderDbColumn({ field, value, label, placeholder, errorClass, isRequired, onChange, optionLabels, selectPlaceholder }: SelectRenderProps) {
  const colDef = field.db_table && field.db_column
    ? getColumnDef(field.db_table, field.db_column)
    : undefined;

  // Fallback: render as text input if column not found in registry
  if (!colDef) {
    return (
      <div key={field.key} className="space-y-1">
        <Label className="text-muted-foreground">{label}{isRequired && ' *'}</Label>
        <Input
          type="text"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={placeholder}
          className={errorClass}
        />
      </div>
    );
  }

  if (colDef.inputType === 'boolean') {
    return renderBoolean({ field, value, label, placeholder, errorClass, isRequired, onChange });
  }

  if (colDef.inputType === 'textarea') {
    return renderMultilineText({ field, value, label, placeholder, errorClass, isRequired, onChange });
  }

  if (colDef.inputType === 'select') {
    return renderSingleSelect({ field, value, label, placeholder, errorClass, isRequired, onChange, optionLabels, selectPlaceholder });
  }

  if (colDef.inputType === 'multiselect') {
    return renderMultiselect({ field, value, label, placeholder, errorClass, isRequired, onChange, optionLabels, selectPlaceholder });
  }

  // text, email, date, number, password — use HTML input type
  const inputTypeMap: Record<string, string> = { text: 'text', email: 'email', date: 'date', number: 'number', password: 'password' };
  const htmlType = inputTypeMap[colDef.inputType] ?? 'text';

  return (
    <div key={field.key} className="space-y-1">
      <Label>{label}{isRequired && ' *'}</Label>
      <Input
        type={htmlType}
        value={(value as string) ?? ''}
        onChange={(e) => onChange(field.key, colDef.inputType === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className={errorClass}
      />
    </div>
  );
}

export function renderServiceSelect({ field, value, label, isRequired, onChange, serviceOptions }: ServiceSelectRenderProps) {
  const selected = (value as string[]) ?? [];
  const options = serviceOptions ?? [];

  if (options.length === 0) {
    return (
      <div key={field.key} className="space-y-1">
        <Label className="text-muted-foreground">{label}{isRequired && ' *'}</Label>
        <p className="text-muted-foreground text-xs">No hay servicios disponibles</p>
      </div>
    );
  }

  return (
    <div key={field.key} className="space-y-2">
      <Label>{label}{isRequired && ' *'}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label key={opt.id} className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(opt.id)}
              onChange={(e) => {
                const next = e.target.checked
                  ? [...selected, opt.id]
                  : selected.filter((id) => id !== opt.id);
                onChange(field.key, next);
              }}
              className="h-4 w-4"
            />
            {opt.name}
          </label>
        ))}
      </div>
    </div>
  );
}

export function renderDefaultInput({ field, value, label, placeholder, errorClass, isRequired, onChange }: FieldRenderProps) {
  const typeMap: Record<string, string> = { number: 'number', email: 'email', password: 'password' };
  const inputType = typeMap[field.type] ?? 'text';

  return (
    <div key={field.key} className="space-y-1">
      <Label>{label}{isRequired && ' *'}</Label>
      <Input
        type={inputType}
        value={(value as string) ?? ''}
        onChange={(e) => onChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className={errorClass}
      />
    </div>
  );
}
