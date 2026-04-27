import { getTranslations } from 'next-intl/server';
import { getTalentServicesStatus } from '../actions/get-talent-services-status';
import { TalentServiceFormEmbed } from './talent-service-form-embed';
import type { TalentServiceStatusItem } from '../actions/get-talent-services-status';

type Props = {
  // País del sitio donde se embebe (= talent.country_id en flow normal).
  // Se valida server-side al resolver el status.
  siteCountryId: string;
  locale: string;
};

// Server Component que renderea un acordeón con un TalentServiceFormEmbed
// por cada servicio que el talent tiene en `talent_services` y que cumple
// los 3 criterios: published + service_countries.country_id + service_cities.city_id.
//
// Identidad y context country/city se resuelven server-side dentro de
// getTalentServicesStatus. El component no acepta talentId — la sesión
// es la fuente de verdad.
//
// `siteCountryId` se pasa al embed interno como contexto para que el
// embed haga su propio resolveTalentAccess + load del form.
export async function TalentServicesAccordion({
  siteCountryId,
  locale,
}: Props) {
  const t = await getTranslations('OnboardingServices');
  const status = await getTalentServicesStatus(locale);

  if (!status.ok) {
    // Reasons: not-authenticated, no-talent-profile, talent-country-not-set.
    // El embed individual también las cubrirá si entra a un servicio,
    // pero acá mostramos un mensaje compacto en lugar del acordeón vacío.
    return (
      <div className="rounded-md border border-dashed p-6 text-center">
        <p className="text-muted-foreground text-sm">{t('emptyState')}</p>
      </div>
    );
  }

  if (status.services.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center">
        <p className="text-muted-foreground text-sm">{t('emptyState')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs">
        {t('savedCount', { saved: status.saved, total: status.total })}
      </p>
      <ul className="space-y-2">
        {status.services.map((item) => (
          <AccordionItem
            key={item.serviceId}
            item={item}
            siteCountryId={siteCountryId}
            locale={locale}
            statusPendingLabel={t('statusPending')}
            statusSavedLabel={t('statusSaved')}
          />
        ))}
      </ul>
    </div>
  );
}

// AccordionItem: usa <details>/<summary> nativo (accesible y simple,
// sin dependencias de shadcn). Cada item es independiente — abrir uno
// no cierra los otros, lo cual permite al talent comparar configuraciones.
function AccordionItem({
  item,
  siteCountryId,
  locale,
  statusPendingLabel,
  statusSavedLabel,
}: {
  item: TalentServiceStatusItem;
  siteCountryId: string;
  locale: string;
  statusPendingLabel: string;
  statusSavedLabel: string;
}) {
  return (
    <li className="rounded-md border">
      <details className="group">
        <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/40">
          <span className="font-medium">{item.label}</span>
          <span
            className={
              item.hasFormData
                ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800'
                : 'rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800'
            }
          >
            {item.hasFormData ? `${statusSavedLabel} ✓` : statusPendingLabel}
          </span>
        </summary>
        <div className="border-t p-4">
          <TalentServiceFormEmbed
            slug={item.slug}
            siteCountryId={siteCountryId}
            locale={locale}
          />
        </div>
      </details>
    </li>
  );
}
