/**
 * Convert a name to a URL-friendly slug.
 * "Tipo de comida" → "tipo-de-comida"
 * Removes accents, replaces spaces/underscores with dashes, strips non-alphanumeric.
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
