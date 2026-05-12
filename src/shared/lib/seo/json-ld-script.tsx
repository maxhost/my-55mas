// Renders a <script type="application/ld+json"> with the given object.
// Safe for RSC. Keep payloads tiny — they ship in the SSR'd HTML.

type Props = { data: object; id?: string };

export function JsonLdScript({ data, id }: Props) {
  return (
    <script
      type="application/ld+json"
      id={id}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
