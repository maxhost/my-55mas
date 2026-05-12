import { getTranslations } from 'next-intl/server';
import { ServiceCard } from '@/shared/components/marketing/service-card';
import {
  ServicesCarousel,
  ServicesFilter,
  type ServicesFilterOption,
} from '@/shared/components/marketing/services-grid';

type CategoryKey = 'all' | 'accompaniment' | 'classes' | 'repairs' | 'home';

type SampleService = {
  id: string;
  category: Exclude<CategoryKey, 'all'>;
  imageSrc: string;
  imageAlt: string;
  title: string;
  bullets: string[];
  tone?: 'coral' | 'salmon';
};

// Hardcoded placeholders. Swapped for a Supabase query in fase 4.
// Titles + bullets stay in Spanish for now since the DB will own them
// (each row has its own i18n jsonb); other locales currently fall back
// to this Spanish copy.
const SAMPLE_SERVICES: SampleService[] = [
  {
    id: 'gastronomy',
    category: 'accompaniment',
    imageSrc: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=60&auto=format',
    imageAlt: 'Experiencia gastronómica',
    title: 'Experiencia Gastronómica',
    bullets: [
      'Comida casera en tu casa Barcelona',
      'Menús personalizados de chefs apasionados',
      'Servicio en toda Barcelona',
    ],
  },
  {
    id: 'chef-home',
    category: 'home',
    imageSrc: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=60&auto=format',
    imageAlt: 'Chef en casa',
    title: 'Chef en Casa',
    bullets: ['Menús personalizados y cocina de calidad', 'Servicio en toda Barcelona'],
  },
  {
    id: 'elder-support',
    category: 'accompaniment',
    imageSrc: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&q=60&auto=format',
    imageAlt: 'Apoyo a mayores',
    title: 'Apoyo a mayores',
    bullets: ['Atención y acompañamiento profesional', 'Servicio en toda Barcelona'],
    tone: 'salmon',
  },
  {
    id: 'home-cleaning',
    category: 'home',
    imageSrc: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=60&auto=format',
    imageAlt: 'Limpieza del hogar',
    title: 'Limpieza del hogar',
    bullets: [
      'Servicio detallado y de confianza',
      'Profesionales con experiencia',
      'Servicio en toda Barcelona',
    ],
  },
  {
    id: 'small-repairs',
    category: 'repairs',
    imageSrc: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&q=60&auto=format',
    imageAlt: 'Pequeñas reparaciones',
    title: 'Pequeñas reparaciones',
    bullets: [
      'Eléctrica, plomería y mantenimiento',
      'Presupuestos sin compromiso',
      'Servicio en toda Barcelona',
    ],
  },
  {
    id: 'cooking-class',
    category: 'classes',
    imageSrc: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=600&q=60&auto=format',
    imageAlt: 'Clases de cocina',
    title: 'Clases de cocina',
    bullets: [
      'Recetas tradicionales y modernas',
      'Pequeños grupos, atención personalizada',
      'En tu casa o en la del chef',
    ],
    tone: 'salmon',
  },
];

type Props = {
  /** Active filter from ?cat=... searchParam. Default 'all'. */
  activeCategory: CategoryKey;
  /** Label of the currently selected city (from cookie). */
  cityLabel: string;
};

export async function HomeServicesSection({ activeCategory, cityLabel }: Props) {
  const t = await getTranslations('home.services');

  const filterKeys: CategoryKey[] = ['all', 'accompaniment', 'classes', 'repairs', 'home'];
  const filterOptions: ServicesFilterOption[] = filterKeys.map((key) => ({
    key,
    label: t(`tabs.${key}`),
    href: key === 'all' ? '/' : `/?cat=${key}`,
  }));

  const visible =
    activeCategory === 'all'
      ? SAMPLE_SERVICES
      : SAMPLE_SERVICES.filter((s) => s.category === activeCategory);

  return (
    <section id="services" className="bg-white px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-[1200px]">
        <h2 className="mb-5 text-center text-2xl font-bold text-brand-text md:mb-7 md:text-[2rem]">
          {t('sectionTitle')}
        </h2>

        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-brand-cream px-3.5 py-2 text-[0.92rem]">
          <span aria-hidden="true">📍</span>
          <span>{t('locatorLabel')}</span>
          <span className="font-bold">{cityLabel}</span>
        </div>

        <ServicesFilter
          options={filterOptions}
          activeKey={activeCategory}
          ariaLabel={t('tabsAria')}
        />

        <ServicesCarousel ariaLabel={t('carouselAria')}>
          {visible.map((s) => (
            <ServiceCard
              key={s.id}
              href={`/servicios/${s.id}`}
              imageSrc={s.imageSrc}
              imageAlt={s.imageAlt}
              category={{ label: t(`tabs.${s.category}`), tone: s.tone }}
              title={s.title}
              bullets={s.bullets}
            />
          ))}
        </ServicesCarousel>

        <div className="mt-7 text-center">
          <a
            href="/servicios"
            className="
              inline-flex items-center justify-center
              rounded-full bg-brand-mustard px-7 py-3.5
              text-base font-semibold text-brand-text
              hover:bg-brand-mustard-deep transition-colors
            "
          >
            {t('viewAll')}
          </a>
        </div>
      </div>
    </section>
  );
}
