'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getServiceForHire } from '@/features/service-hire/actions/get-service-for-hire';
import type { PublishedServiceOption } from '@/features/service-hire/actions/list-published-services';
import type { ServiceForHire } from '@/features/service-hire/actions/get-service-for-hire';
import type { FiscalIdTypeOption } from '@/features/service-hire/actions/list-fiscal-id-types';
import { ServiceHireForm } from '@/features/service-hire/components/service-hire-form';

type Props = {
  services: PublishedServiceOption[];
  locale: string;
  fiscalIdTypes: FiscalIdTypeOption[];
};

export function TestServiceHirePage({ services, locale, fiscalIdTypes }: Props) {
  const t = useTranslations('AdminTestServiceHire');
  const tg = useTranslations('ServiceHire');
  const [serviceId, setServiceId] = useState<string>('');
  const [service, setService] = useState<ServiceForHire | null>(null);
  const [isLoading, startTransition] = useTransition();

  const handleSelect = (id: string) => {
    setServiceId(id);
    if (!id) {
      setService(null);
      return;
    }
    startTransition(async () => {
      const data = await getServiceForHire(id, locale);
      setService(data);
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="service-picker">{t('chooseService')}</Label>
        <Select value={serviceId} onValueChange={(v) => handleSelect(v ?? '')}>
          <SelectTrigger id="service-picker">
            <SelectValue placeholder={t('chooseServicePlaceholder')}>
              {(v: string) => services.find((s) => s.id === v)?.name ?? t('chooseServicePlaceholder')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {services.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {services.length === 0 && (
          <p className="text-muted-foreground text-xs italic">{t('noServices')}</p>
        )}
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">{t('loading')}</p>}

      {service && !isLoading && (
        <div className="space-y-3 rounded-md border p-4">
          <div>
            <h2 className="text-xl font-semibold">{service.name}</h2>
            {service.description && (
              <p className="text-muted-foreground text-sm">{service.description}</p>
            )}
            <p className="text-muted-foreground mt-1 text-xs">
              {t('countriesLabel')}: {service.activeCountryCodes.join(', ') || '—'} ·{' '}
              {t('questionsCount', { count: service.questions.length })}
            </p>
          </div>

          <ServiceHireForm
            service={service}
            locale={locale}
            fiscalIdTypes={fiscalIdTypes}
            hints={{
              addressLabel: tg('addressLabel'),
              addressPlaceholder: tg('addressPlaceholder'),
              notesLabel: tg('notesLabel'),
              notesPlaceholder: tg('notesPlaceholder'),
              termsLabel: tg('termsLabel'),
              submit: tg('submit'),
              submitDisabledHint: tg('submitDisabledHint'),
              submitSuccess: tg('submitSuccess'),
              scheduling: {
                title: tg('schedulingTitle'),
                scheduleType: tg('scheduleType'),
                once: tg('once'),
                recurring: tg('recurring'),
                date: tg('date'),
                timeStart: tg('timeStart'),
                timeEnd: tg('timeEnd'),
                frequency: tg('frequency'),
                weekly: tg('weekly'),
                monthly: tg('monthly'),
                weekdays: tg('weekdays'),
                dayOfMonth: tg('dayOfMonth'),
                endDate: tg('endDate'),
                localTimeNote: tg('localTimeNote'),
              },
              auth: {
                title: tg('authTitle'),
                guest: tg('authGuest'),
                signup: tg('authSignup'),
                login: tg('authLogin'),
                signupName: tg('authSignupName'),
                signupEmail: tg('authSignupEmail'),
                signupPassword: tg('authSignupPassword'),
                signupPhone: tg('authSignupPhone'),
                signupConfirm: tg('authSignupConfirm'),
                loginEmail: tg('authLoginEmail'),
                loginPassword: tg('authLoginPassword'),
                loginConfirm: tg('authLoginConfirm'),
                authenticatedAs: tg('authAuthenticatedAs'),
                asGuest: tg('authAsGuest'),
                error: tg('authError'),
                guestData: {
                  title: tg('guestDataTitle'),
                  name: tg('guestDataName'),
                  email: tg('guestDataEmail'),
                  phone: tg('guestDataPhone'),
                  fiscalType: tg('fiscalType'),
                  fiscalTypePlaceholder: tg('fiscalTypePlaceholder'),
                  fiscalNumber: tg('fiscalNumber'),
                  fiscalNumberPlaceholder: tg('fiscalNumberPlaceholder'),
                  formatError: tg('fiscalFormatError'),
                  emailRegistered: tg('emailAlreadyRegistered'),
                  submit: tg('guestDataSubmit'),
                  error: tg('authError'),
                },
              },
              billing: {
                legend: tg('billingLegend'),
                same: tg('billingSame'),
                custom: tg('billingCustom'),
                name: tg('billingName'),
                phone: tg('billingPhone'),
                fiscalType: tg('fiscalType'),
                fiscalTypePlaceholder: tg('fiscalTypePlaceholder'),
                fiscalNumber: tg('fiscalNumber'),
                fiscalNumberPlaceholder: tg('fiscalNumberPlaceholder'),
                formatError: tg('fiscalFormatError'),
              },
              questions: {
                yes: tg('yes'),
                no: tg('no'),
                fileTooLarge: tg('fileTooLarge'),
                fileWrongType: tg('fileWrongType'),
              },
              addressError: tg('validationAddressRequired'),
              validation: {
                addressRequired: tg('validationAddressRequired'),
                dateRequired: tg('validationDateRequired'),
                timeStartRequired: tg('validationTimeStartRequired'),
                frequencyRequired: tg('validationFrequencyRequired'),
                weekdaysRequired: tg('validationWeekdaysRequired'),
                dayOfMonthRequired: tg('validationDayOfMonthRequired'),
                termsRequired: tg('validationTermsRequired'),
                authRequired: tg('validationAuthRequired'),
                fieldRequired: tg('validationFieldRequired'),
                billingCustomIncomplete: tg('validationBillingCustomIncomplete'),
              },
            }}
          />
        </div>
      )}
    </div>
  );
}
