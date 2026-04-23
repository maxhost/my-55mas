import type { Sb } from './persistence/context';

const FALLBACK_LOCALE = 'es';

export type ServiceOption = {
  id: string;
  name: string;
};

// Carga servicios publicados para usar como opciones de un field con
// persistence_type='service_select'. Mismo pattern que subtype: nombres
// traducidos con fallback a 'es', fallback final al id.
// Sin filtro por país — coherente con getServiceOptionsForForm (legacy).
export async function loadPublishedServicesForLocale(
  supabase: Sb,
  locale: string
): Promise<ServiceOption[]> {
  const { data, error } = await supabase
    .from('services')
    .select('id, status, service_translations(locale, name)')
    .eq('status', 'published');
  if (error || !data) return [];

  return data.map((row) => {
    const trans =
      (row.service_translations as unknown as {
        locale: string;
        name: string;
      }[]) ?? [];
    const pick = (l: string) => trans.find((t) => t.locale === l)?.name;
    const name = pick(locale) ?? pick(FALLBACK_LOCALE) ?? row.id;
    return { id: row.id as string, name };
  });
}
