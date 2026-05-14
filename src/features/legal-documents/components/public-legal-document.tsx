type Props = { title: string; richHtml: string };

// Renders a legal document. richHtml is already sanitized server-side at
// save time via DOMPurify with a strict allowlist (p h2 h3 ul ol li
// strong em u a br) — see `src/shared/lib/lexical/sanitize-rich-html.ts`.
// We do NOT re-sanitize on the client.
export function PublicLegalDocument({ title, richHtml }: Props) {
  return (
    <article>
      <h1 className="m-0 mb-6 text-3xl font-bold text-brand-text md:text-[2rem]">
        {title}
      </h1>
      <div
        className="
          max-w-none
          [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-brand-text
          [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-brand-text
          [&_p]:my-3 [&_p]:leading-relaxed [&_p]:text-brand-text
          [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6
          [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6
          [&_li]:my-1
          [&_a]:text-brand-red [&_a]:underline hover:[&_a]:opacity-80
          [&_strong]:font-bold
        "
        dangerouslySetInnerHTML={{ __html: richHtml }}
      />
    </article>
  );
}
