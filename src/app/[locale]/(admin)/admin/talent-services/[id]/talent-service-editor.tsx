'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TalentServiceBuilder } from '@/features/talent-services/components/talent-service-builder';
import { TalentServiceConfig } from '@/features/talent-services/components/talent-service-config';
import type {
  FormWithTranslations,
  FormVariantSummary,
  FormCountryOption,
  FormCityOption,
} from '@/shared/lib/forms/types';
import type { SubtypeGroupOption } from '@/shared/components/form-builder/subtype-field-config';

type Props = {
  serviceId: string;
  serviceSlug: string;
  form: FormWithTranslations | null;
  formVariants: FormVariantSummary[];
  serviceCountries: FormCountryOption[];
  serviceCities: FormCityOption[];
  subtypeGroups: SubtypeGroupOption[];
};

export function TalentServiceEditor({
  serviceId,
  serviceSlug,
  form,
  formVariants,
  serviceCountries,
  serviceCities,
  subtypeGroups,
}: Props) {
  const t = useTranslations('AdminTalentServices');
  const tc = useTranslations('Common');

  // Snippet pegable. Server Component que resuelve country/city del talent
  // autenticado internamente. El embedder sólo provee siteCountryId
  // (del contexto del sitio donde se embebe), locale, y opcionalmente
  // onSubmit. Comentado en es para que admins lean qué pasa al pegarlo.
  const embedSnippet = `// El site tiene asignado un país. El embed resuelve country_id y city_id
// del talent autenticado desde su profile. Si el talent no está en el
// mismo país que el site, o no hay variant para su ciudad, el form
// muestra un mensaje de no-disponible en lugar de renderizar.
//
// Recomendado envolver con <Suspense fallback={...}> para loading UX.
<TalentServiceFormEmbed
  slug="${serviceSlug}"
  siteCountryId={siteCountryId}
  locale={locale}
/>`;

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedSnippet);
    toast.success(tc('copiedSuccess'));
  };

  return (
    <Tabs defaultValue="config">
      <TabsList>
        <TabsTrigger value="config">{t('tabConfig')}</TabsTrigger>
        <TabsTrigger value="form">{t('tabForm')}</TabsTrigger>
        <TabsTrigger value="embed">{t('tabEmbed')}</TabsTrigger>
      </TabsList>

      <TabsContent value="config" className="pt-6">
        <TalentServiceConfig
          serviceCountries={serviceCountries}
          serviceCities={serviceCities}
          formVariants={formVariants}
        />
      </TabsContent>

      <TabsContent value="form" className="pt-6">
        <TalentServiceBuilder
          serviceId={serviceId}
          form={form}
          formVariants={formVariants}
          serviceCountries={serviceCountries}
          serviceCities={serviceCities}
          subtypeGroups={subtypeGroups}
        />
      </TabsContent>

      <TabsContent value="embed" className="space-y-3 pt-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{t('embedCode')}</h3>
          <p className="text-muted-foreground text-xs">{t('embedHint')}</p>
          <div className="relative">
            <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">
              {embedSnippet}
            </pre>
            <Button
              variant="ghost"
              size="icon-xs"
              className="absolute right-2 top-2"
              onClick={copyEmbed}
            >
              <Copy className="size-3" />
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
