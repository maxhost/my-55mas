import { getTranslations } from 'next-intl/server';
import {
  TestimonialCard,
  TestimonialsCarousel,
} from '@/shared/components/marketing/testimonial';

// Hardcoded for now (extracted verbatim from 55mas.es rendered DOM).
// Replaced by a Supabase query in fase 4 once we land the testimonials
// table.
const SAMPLE_TESTIMONIALS = [
  {
    id: 'andrea',
    author: 'Andrea',
    quote:
      '"Fue la primera vez que utilicé 55+ y sin duda es una experiencia para repetir. Pasó poco más de una semana desde que pedí el servicio hasta que se realizó. El proceso fue simple, eficiente y, lo más importante: João hizo un excelente trabajo en nuestro jardín. Si pudiera dar más estrellas, las daría :) ¡Felicidades por este proyecto!"',
  },
  {
    id: 'monica',
    author: 'Monica',
    quote: '"¡Un servicio maravilloso! El talento me mantuvo siempre informada con fotos y mensajes."',
  },
  {
    id: 'sofia',
    author: 'Sofia',
    quote: '"A mi madre le gustó mucho el servicio de Maria Paula. Gracias."',
  },
];

export async function HomeTestimonials() {
  const t = await getTranslations('home.testimonials');

  return (
    <section className="bg-white px-4 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-[1200px]">
        <h2 className="m-0 mb-1.5 text-center text-2xl font-bold text-brand-text md:text-[2rem]">
          {t('title')}
        </h2>
        <p className="mb-9 text-center text-base font-semibold text-brand-text">
          {t('subtitle')}
        </p>
        <TestimonialsCarousel ariaLabel={t('carouselAria')}>
          {SAMPLE_TESTIMONIALS.map((it) => (
            <TestimonialCard
              key={it.id}
              roleLabel={t('roleLabel')}
              rating={5}
              quote={it.quote}
              author={{ name: it.author }}
            />
          ))}
        </TestimonialsCarousel>
      </div>
    </section>
  );
}
