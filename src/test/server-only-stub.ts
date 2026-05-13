// Vitest alias for Next.js's "server-only" sentinel package. The real
// package throws at build time when imported from a client bundle —
// in jsdom tests we just need a no-op.
export {};
