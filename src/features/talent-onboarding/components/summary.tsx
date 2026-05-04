'use client';

import { useTransition } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  OnboardingContext,
  OnboardingState,
  StepIndex,
} from '../types';

export type SummaryHints = {
  title: string;
  description: string;
  sectionPersonal: string;
  sectionContact: string;
  sectionProfessional: string;
  sectionServices: string;
  sectionPayments: string;
  sectionLanguages: string;
  sectionSurvey: string;
  edit: string;
  /** Final CTA at the bottom of the summary that completes the onboarding. */
  finalContinue: string;
  /** Generic error shown if completeOnboarding fails. */
  errorPrefix: string;
  /** Pretty labels for enum values, used in the read-only cards. */
  genderMale: string;
  genderFemale: string;
  contactWhatsapp: string;
  contactEmail: string;
  contactPhone: string;
  professionalPreRetired: string;
  professionalUnemployed: string;
  professionalEmployed: string;
  professionalRetired: string;
  paymentMonthly: string;
  paymentAccumulate: string;
  yes: string;
  no: string;
  noServices: string;
  noLanguages: string;
  noSurvey: string;
};

type Props = {
  state: OnboardingState;
  context: OnboardingContext;
  hints: SummaryHints;
  onEdit: (step: StepIndex) => void;
  onComplete: () => Promise<{ error?: string } | void>;
};

export function Summary({ state, context, hints, onEdit, onComplete }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleComplete = () => {
    startTransition(async () => {
      await onComplete();
    });
  };

  const lookupServiceName = (id: string): string => {
    const s = context.availableServices.find((x) => x.id === id);
    return s?.name ?? id.slice(0, 8);
  };
  const lookupLanguageName = (code: string): string => {
    const l = context.spokenLanguages.find((x) => x.code === code);
    return l?.name ?? code;
  };

  const personal = state.personalData;
  const contact = state.contactAddress;
  const professional = state.professionalSituation;
  const services = state.services.entries;
  const payments = state.payments;
  const languages = state.languages.language_codes;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">{hints.title}</h2>
        <p className="text-muted-foreground text-sm">{hints.description}</p>
      </div>

      <SectionCard title={hints.sectionPersonal} edit={hints.edit} onEdit={() => onEdit(1)}>
        {personal ? (
          <Row label="Género" value={personal.gender === 'male' ? hints.genderMale : hints.genderFemale} />
        ) : null}
        {personal ? <Row label="Fecha nac." value={personal.birth_date} /> : null}
      </SectionCard>

      <SectionCard title={hints.sectionContact} edit={hints.edit} onEdit={() => onEdit(2)}>
        {contact ? (
          <>
            <Row
              label="Contacto"
              value={
                contact.preferred_contact === 'whatsapp'
                  ? hints.contactWhatsapp
                  : contact.preferred_contact === 'email'
                  ? hints.contactEmail
                  : hints.contactPhone
              }
            />
            <Row label="País" value={context.countryName} />
            <Row label="Dirección" value={contact.address.raw_text} />
          </>
        ) : null}
      </SectionCard>

      <SectionCard title={hints.sectionProfessional} edit={hints.edit} onEdit={() => onEdit(3)}>
        {professional ? (
          <Row
            label="Situación"
            value={
              professional.professional_status === 'pre_retired'
                ? hints.professionalPreRetired
                : professional.professional_status === 'unemployed'
                ? hints.professionalUnemployed
                : professional.professional_status === 'employed'
                ? hints.professionalEmployed
                : hints.professionalRetired
            }
          />
        ) : null}
        {professional?.previous_experience ? (
          <Row label="Experiencia" value={professional.previous_experience} />
        ) : null}
      </SectionCard>

      <SectionCard title={hints.sectionServices} edit={hints.edit} onEdit={() => onEdit(4)}>
        {services.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">{hints.noServices}</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {services.map((e) => (
              <li key={e.service_id} className="flex justify-between">
                <span>{lookupServiceName(e.service_id)}</span>
                <span className="font-mono">{e.unit_price.toFixed(2)} €</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title={hints.sectionPayments} edit={hints.edit} onEdit={() => onEdit(5)}>
        {payments ? (
          <>
            <Row label="Seg. Social" value={payments.has_social_security ? hints.yes : hints.no} />
            <Row
              label="Método"
              value={
                payments.preferred_payment === 'monthly_invoice'
                  ? hints.paymentMonthly
                  : hints.paymentAccumulate
              }
            />
          </>
        ) : null}
      </SectionCard>

      <SectionCard title={hints.sectionLanguages} edit={hints.edit} onEdit={() => onEdit(6)}>
        {languages.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">{hints.noLanguages}</p>
        ) : (
          <p className="text-sm">{languages.map(lookupLanguageName).join(', ')}</p>
        )}
      </SectionCard>

      <SectionCard title={hints.sectionSurvey} edit={hints.edit} onEdit={() => onEdit(7)}>
        {Object.keys(state.survey).length === 0 ? (
          <p className="text-muted-foreground text-sm italic">{hints.noSurvey}</p>
        ) : (
          <ul className="space-y-1 text-xs">
            {Object.entries(state.survey).map(([k, v]) => (
              <li key={k}>
                <span className="text-muted-foreground font-mono">{k}</span>:{' '}
                {typeof v === 'string' ? v : JSON.stringify(v)}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Button onClick={handleComplete} disabled={isPending} className="w-full">
        {isPending ? '…' : hints.finalContinue}
      </Button>
    </div>
  );
}

function SectionCard({
  title,
  edit,
  onEdit,
  children,
}: {
  title: string;
  edit: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="mr-1 h-3 w-3" />
          {edit}
        </Button>
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
