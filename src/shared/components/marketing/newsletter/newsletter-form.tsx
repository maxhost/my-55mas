import { getTranslations } from 'next-intl/server';

// Newsletter form (visual only in fase 1.2). Fase 5.2 will wire it to a
// real Server Action with Zod validation, rate limiting, honeypot, and
// the email provider integration the client decides on.
export async function NewsletterForm() {
  const t = await getTranslations('newsletter');

  return (
    <section className="bg-brand-mustard py-16 px-4">
      <div className="mx-auto max-w-[640px] text-center">
        <h2 className="m-0 mb-2.5 text-2xl font-bold text-brand-text md:text-[1.6rem]">
          {t('title')}
        </h2>
        <p className="mb-6 text-brand-text">{t('lead')}</p>
        <form
          action="#"
          method="post"
          aria-label={t('formAria')}
          className="flex flex-col gap-2.5 sm:flex-row"
        >
          <label className="sr-only" htmlFor="newsletter-email">
            {t('emailLabel')}
          </label>
          <input
            id="newsletter-email"
            type="email"
            name="email"
            required
            placeholder={t('placeholder')}
            className="
              flex-1 rounded-full bg-white px-[18px] py-3
              text-base text-brand-text
              border border-black/10
              focus:outline-none focus-visible:outline focus-visible:outline-2
              focus-visible:outline-brand-text focus-visible:outline-offset-1
            "
          />
          <button
            type="submit"
            className="
              inline-flex items-center justify-center
              rounded-full bg-white text-brand-text
              border border-white
              px-7 py-3
              text-sm font-bold
              hover:bg-brand-text hover:text-white hover:border-brand-text
              transition-colors
            "
          >
            {t('submit')}
          </button>
        </form>
      </div>
    </section>
  );
}
