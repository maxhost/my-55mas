'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { CountryAdminOption } from '@/shared/lib/countries/types';
import type { CityOption } from '@/shared/lib/countries/list-active-cities';
import { submitSuggestion } from '../actions/submit-suggestion';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  countries: CountryAdminOption[];
  cities: CityOption[];
};

type FormState = {
  fullName: string;
  serviceNeeded: string;
  email: string;
  countryId: string;
  cityId: string;
  comments: string;
  honeypot: string;
};

const EMPTY: FormState = {
  fullName: '',
  serviceNeeded: '',
  email: '',
  countryId: '',
  cityId: '',
  comments: '',
  honeypot: '',
};

const inputClass =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2 ' +
  'text-sm text-brand-text focus:outline-none focus-visible:outline ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-brand-text';

export function SuggestionFormModal({
  open,
  onOpenChange,
  countries,
  cities,
}: Props) {
  const t = useTranslations('ServiceSuggestion');
  const locale = useLocale();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();
  const openedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (open) openedAtRef.current = Date.now();
  }, [open]);

  const reset = () => {
    setForm(EMPTY);
    setFieldErrors({});
  };

  const handleOpenChange = (next: boolean) => {
    if (isPending) return; // block Esc/backdrop/Close while sending
    if (!next) reset();
    onOpenChange(next);
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const cityChoices = cities.filter((c) => c.countryId === form.countryId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    startTransition(async () => {
      const res = await submitSuggestion({
        fullName: form.fullName,
        serviceNeeded: form.serviceNeeded,
        email: form.email,
        countryId: form.countryId,
        cityId: form.cityId,
        comments: form.comments,
        locale,
        honeypot: form.honeypot,
        elapsedMs: Date.now() - openedAtRef.current,
      });

      if ('data' in res) {
        toast.success(t('successToast'));
        reset();
        onOpenChange(false);
        return;
      }
      const { code } = res.error;
      if (code === 'invalid') {
        setFieldErrors(res.error.fieldErrors ?? {});
        return;
      }
      if (code === 'invalid-location') toast.error(t('errorLocation'));
      else if (code === 'email-not-configured')
        toast.error(t('errorNotConfigured'));
      else if (code === 'send-failed') toast.error(t('errorSend'));
      else toast.error(t('errorGeneric')); // 'spam' → generic
    });
  };

  const err = (k: string) => fieldErrors[k]?.[0];

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/30 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <Dialog.Title className="m-0 text-xl font-bold text-brand-text">
              {t('modalTitle')}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-brand-text/70">
              {t('modalDescription')}
            </Dialog.Description>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              {/* Honeypot — visually hidden, off-screen (not display:none) */}
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={form.honeypot}
                onChange={(e) => set('honeypot', e.target.value)}
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
              />

              <div>
                <label
                  htmlFor="sg-fullName"
                  className="mb-1 block text-sm font-medium text-brand-text"
                >
                  {t('fullNameLabel')}
                </label>
                <input
                  id="sg-fullName"
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  placeholder={t('fullNamePlaceholder')}
                  className={inputClass}
                />
                {err('fullName') && (
                  <p className="mt-1 text-xs text-brand-red">
                    {t('validation.fullName')}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="sg-service"
                  className="mb-1 block text-sm font-medium text-brand-text"
                >
                  {t('serviceNeededLabel')}
                </label>
                <input
                  id="sg-service"
                  type="text"
                  required
                  value={form.serviceNeeded}
                  onChange={(e) => set('serviceNeeded', e.target.value)}
                  placeholder={t('serviceNeededPlaceholder')}
                  className={inputClass}
                />
                {err('serviceNeeded') && (
                  <p className="mt-1 text-xs text-brand-red">
                    {t('validation.serviceNeeded')}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="sg-email"
                  className="mb-1 block text-sm font-medium text-brand-text"
                >
                  {t('emailLabel')}
                </label>
                <input
                  id="sg-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className={inputClass}
                />
                {err('email') && (
                  <p className="mt-1 text-xs text-brand-red">
                    {t('validation.email')}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="sg-country"
                    className="mb-1 block text-sm font-medium text-brand-text"
                  >
                    {t('countryLabel')}
                  </label>
                  <select
                    id="sg-country"
                    required
                    value={form.countryId}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        countryId: e.target.value,
                        cityId: '',
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">{t('countryPlaceholder')}</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {err('countryId') && (
                    <p className="mt-1 text-xs text-brand-red">
                      {t('validation.countryId')}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="sg-city"
                    className="mb-1 block text-sm font-medium text-brand-text"
                  >
                    {t('cityLabel')}
                  </label>
                  <select
                    id="sg-city"
                    required
                    disabled={!form.countryId}
                    value={form.cityId}
                    onChange={(e) => set('cityId', e.target.value)}
                    className={`${inputClass} disabled:opacity-50`}
                  >
                    <option value="">
                      {form.countryId
                        ? t('cityPlaceholder')
                        : t('cityDisabledHint')}
                    </option>
                    {cityChoices.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {err('cityId') && (
                    <p className="mt-1 text-xs text-brand-red">
                      {t('validation.cityId')}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="sg-comments"
                  className="mb-1 block text-sm font-medium text-brand-text"
                >
                  {t('commentsLabel')}
                </label>
                <textarea
                  id="sg-comments"
                  rows={4}
                  value={form.comments}
                  onChange={(e) => set('comments', e.target.value)}
                  placeholder={t('commentsPlaceholder')}
                  className={inputClass}
                />
              </div>

              <div className="mt-2 flex justify-end gap-3">
                <Dialog.Close
                  disabled={isPending}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold text-brand-text hover:bg-brand-cream disabled:opacity-50"
                >
                  {t('cancel')}
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-brand-mustard px-6 py-2.5 text-sm font-semibold text-brand-text hover:bg-brand-mustard-deep disabled:opacity-60"
                >
                  {t('submit')}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
