// Single source of truth for the service-cover storage layout. The DB
// column services.cover_image_url stores the BASE path (no size, no
// extension). All consumers build their full URL via these helpers so
// the scheme stays consistent.
//
// Bucket: service-images (public, see migration history).
// Layout: services/<service_id>/cover-{size}.webp
//
// Sizes are picked to match common render contexts:
//   - thumb:  200w  — admin lists, avatars
//   - card:   800w  — public service grid (cards are ≤327×280 visible,
//                     so 800w covers 2× DPI comfortably)
//   - hero:  1600w  — service detail hero, full-bleed sections

import { createClient } from '@supabase/supabase-js';

export const SERVICE_IMAGES_BUCKET = 'service-images';

export const COVER_SIZES = ['thumb', 'card', 'hero'] as const;
export type CoverSize = (typeof COVER_SIZES)[number];

export const COVER_MAX_WIDTH: Record<CoverSize, number> = {
  thumb: 200,
  card: 800,
  hero: 1600,
};

/** Storage path *within* the bucket — used by upload + delete. */
export function coverStoragePath(serviceId: string, size: CoverSize): string {
  return `services/${serviceId}/cover-${size}.webp`;
}

/** Base path stored in services.cover_image_url (no size suffix). */
export function coverBasePath(serviceId: string): string {
  return `services/${serviceId}/cover`;
}

/**
 * Build the public URL for a given cover at the requested size. Uses the
 * NEXT_PUBLIC_SUPABASE_URL env var so it is callable from RSC and Client
 * Components alike. Returns null when base is empty / null.
 */
export function buildCoverPublicUrl(
  base: string | null | undefined,
  size: CoverSize,
): string | null {
  if (!base) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/${SERVICE_IMAGES_BUCKET}/${base}-${size}.webp`;
}

// Server-only helper: creates a Supabase client with the service role
// key for cover deletion (admin endpoint, RLS bypassed). DO NOT export
// from any client-reachable barrel.
export function createCoverStorageAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
