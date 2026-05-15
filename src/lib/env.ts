import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    // Optional so deployments don't fail to build before the secret is
    // configured. The translate-with-claude helper validates at runtime
    // and surfaces a clean error to the UI when missing.
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-6'),
    // Optional so deployments don't fail to build before the email
    // is configured. submit-suggestion validates at runtime and
    // surfaces a clean error to the UI when any is missing.
    RESEND_API_KEY: z.string().min(1).optional(),
    SERVICE_SUGGESTIONS_FROM_EMAIL: z.string().email().optional(),
    SERVICE_SUGGESTIONS_TO_EMAIL: z.string().email().optional(),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },
  runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    SERVICE_SUGGESTIONS_FROM_EMAIL: process.env.SERVICE_SUGGESTIONS_FROM_EMAIL,
    SERVICE_SUGGESTIONS_TO_EMAIL: process.env.SERVICE_SUGGESTIONS_TO_EMAIL,
  },
});
