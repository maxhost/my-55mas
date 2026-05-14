import { getTranslations } from 'next-intl/server';
import { loadHomeReviews } from '@/features/public-home/lib/load-home-reviews';
import {
  TestimonialCard,
  TestimonialsCarousel,
} from '@/shared/components/marketing/testimonial';

type Props = { locale: string };

export async function HomeTestimonials({ locale }: Props) {
  const [t, reviews] = await Promise.all([
    getTranslations('home.testimonials'),
    loadHomeReviews(locale),
  ]);

  if (reviews.length === 0) return null;

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
          {reviews.map((r) => (
            <TestimonialCard
              key={r.id}
              roleLabel={t('roleLabel')}
              rating={r.rating}
              quote={r.quote}
              author={{ name: r.authorName }}
              photoUrl={r.photoUrl}
            />
          ))}
        </TestimonialsCarousel>
      </div>
    </section>
  );
}
