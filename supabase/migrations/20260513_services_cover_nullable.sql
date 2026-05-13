-- services.cover_image_url is currently NOT NULL with a "" default in
-- production data (no service has a real image yet). We are about to
-- ship a real upload pipeline from admin/services; while it rolls out,
-- a service can legitimately have no cover yet. Make the column nullable
-- and normalise existing empty strings to NULL so downstream code
-- (frontend service cards, next/image) can branch on the absence of an
-- image instead of having to handle both '' and NULL.

ALTER TABLE public.services
  ALTER COLUMN cover_image_url DROP NOT NULL;

UPDATE public.services
SET cover_image_url = NULL
WHERE cover_image_url = '';

COMMENT ON COLUMN public.services.cover_image_url IS
  'Base storage path inside the service-images bucket (e.g. services/<id>/cover). Frontend appends -thumb.webp / -card.webp / -hero.webp via the helper. NULL means no cover uploaded yet.';
