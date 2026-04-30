'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  INPUT_TYPES,
  PERSISTENCE_TYPES,
  type InputType,
  type PersistenceType,
} from '@/shared/lib/field-catalog/types';
import {
  dbColumnHasAutoOptions,
  getStaticDbColumnOptions,
} from '@/shared/lib/field-catalog/db-column-options';
import { getColumnDef } from '@/shared/lib/forms/db-column-registry';
import type { FieldDefinitionWithTranslations } from '../types';
import type { SubtypeGroupOption } from '@/shared/lib/field-catalog/subtype-groups';
import { PersistenceTargetFields } from './persistence-target-fields';
import { FieldTranslationTabs } from './field-translation-tabs';
import { TermsCheckboxConfig } from './field-definition-sheet/terms-config';
import { EmailAuthConfig } from './field-definition-sheet/email-auth-config';
import { RegistryOptionsPreview } from './field-definition-sheet/registry-options-preview';
import { useFieldDefinitionForm } from './field-definition-sheet/use-field-definition-form';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  field: FieldDefinitionWithTranslations | null;
  subtypeGroups: SubtypeGroupOption[];
};

export function FieldDefinitionSheet({
  open,
  onOpenChange,
  groupId,
  field,
  subtypeGroups,
}: Props) {
  const t = useTranslations('AdminFieldCatalog');
  const { state, setters, handlers } = useFieldDefinitionForm({
    open,
    groupId,
    field,
    onSaved: () => onOpenChange(false),
  });

  // Flags derivados del state — decisión de qué bloques renderizar.
  const isDynamicOptions =
    state.persistenceType === 'subtype' || state.persistenceType === 'service_select';
  const dbColumnTarget =
    state.persistenceType === 'db_column'
      ? (state.target as { table?: string; column?: string } | null)
      : null;
  const registryAutoOptions =
    !!(dbColumnTarget?.table && dbColumnTarget?.column) &&
    dbColumnHasAutoOptions({
      table: dbColumnTarget.table,
      column: dbColumnTarget.column,
    });
  const takesOptions =
    state.inputType === 'single_select' ||
    state.inputType === 'multiselect_checkbox' ||
    state.inputType === 'multiselect_dropdown';
  const isEmailAuth =
    state.inputType === 'email' && state.persistenceType === 'auth';
  const hasOptions = takesOptions && !isDynamicOptions && !registryAutoOptions;
  const registryPreviewOptions =
    registryAutoOptions && dbColumnTarget?.table && dbColumnTarget?.column
      ? getStaticDbColumnOptions({
          table: dbColumnTarget.table,
          column: dbColumnTarget.column,
        })
      : null;
  const registryPreviewSource =
    registryAutoOptions && dbColumnTarget?.table && dbColumnTarget?.column
      ? getColumnDef(dbColumnTarget.table, dbColumnTarget.column)?.optionsSource
      : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{field ? t('editField') : t('addField')}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handlers.handleSubmit} className="space-y-4 p-4">
          <div className="space-y-2">
            <Label>{t('key')} *</Label>
            <Input
              value={state.key}
              onChange={(e) => setters.setKey(e.target.value)}
              placeholder="full_name"
              required
            />
            <p className="text-muted-foreground text-xs">{t('keyHint')}</p>
          </div>

          <div className="space-y-2">
            <Label>{t('inputType')}</Label>
            <Select
              value={state.inputType}
              onValueChange={(v) => {
                if (v == null) return;
                handlers.handleInputTypeChange(v as InputType);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INPUT_TYPES.map((it) => (
                  <SelectItem key={it} value={it}>
                    {it}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {state.inputType !== 'display_text' && (
            <div className="space-y-2">
              <Label>{t('persistenceType')}</Label>
              <Select
                value={state.persistenceType}
                onValueChange={(v) => {
                  if (v == null) return;
                  handlers.handlePersistenceTypeChange(v as PersistenceType);
                }}
                /* talent_services_panel forza persistence_type=service_select.
                 * Deshabilitar el dropdown evita que el admin lo cambie y
                 * rompa la semántica del panel. */
                disabled={state.inputType === 'talent_services_panel'}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERSISTENCE_TYPES.filter((pt) => pt !== 'none').map((pt) => (
                    <SelectItem key={pt} value={pt}>
                      {pt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.inputType === 'talent_services_panel' && (
                <p className="text-muted-foreground text-xs">
                  {t('panelLockedPersistence')}
                </p>
              )}
            </div>
          )}

          {state.inputType !== 'display_text' && (
            <PersistenceTargetFields
              persistenceType={state.persistenceType}
              target={state.target}
              onChange={setters.setTarget}
              subtypeGroups={subtypeGroups}
            />
          )}

          {hasOptions && (
            <div className="space-y-2">
              <Label>Options</Label>
              <Input
                value={state.optionsText}
                onChange={(e) => setters.setOptionsText(e.target.value)}
                placeholder="a, b, c"
              />
              <p className="text-muted-foreground text-xs">{t('optionsHint')}</p>
            </div>
          )}

          {takesOptions && registryAutoOptions && (
            <RegistryOptionsPreview
              staticOptions={registryPreviewOptions}
              source={registryPreviewSource}
            />
          )}

          {state.inputType === 'terms_checkbox' && (
            <TermsCheckboxConfig
              tosUrl={state.tosUrl}
              privacyUrl={state.privacyUrl}
              onTosUrlChange={setters.setTosUrl}
              onPrivacyUrlChange={setters.setPrivacyUrl}
            />
          )}

          {isEmailAuth && (
            <EmailAuthConfig
              allowChange={state.allowChange}
              onAllowChangeChange={setters.setAllowChange}
            />
          )}

          <FieldTranslationTabs
            translations={state.translations}
            onChange={setters.setTranslations}
            isDisplayText={state.inputType === 'display_text'}
            isTermsCheckbox={state.inputType === 'terms_checkbox'}
            isEmailWithChange={isEmailAuth && state.allowChange}
          />

          <div className="space-y-2">
            <Label>{t('sortOrder')}</Label>
            <Input
              type="number"
              value={state.sortOrder}
              onChange={(e) =>
                setters.setSortOrder(parseInt(e.target.value, 10) || 0)
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="field-active"
              checked={state.isActive}
              onCheckedChange={(v) => setters.setIsActive(v === true)}
            />
            <Label htmlFor="field-active">{t('active')}</Label>
          </div>

          {state.error && (
            <p className="text-destructive text-sm">{state.error}</p>
          )}

          <Button type="submit" disabled={state.isPending} className="w-full">
            {state.isPending ? t('saving') : t('save')}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
