import { z } from 'zod';

export const createMemberSchema = z
  .object({
    first_name: z.string().min(1).max(100),
    last_name: z.string().min(1).max(100),
    email: z.string().email(),
    role: z.enum(['admin', 'manager', 'viewer']),
    country_id: z.string().uuid().nullable(),
    city_id: z.string().uuid().nullable(),
    team_id: z.string().uuid().nullable(),
  })
  .refine(
    (data) => data.role === 'admin' || data.country_id !== null,
    { message: 'Country is required for manager/viewer', path: ['country_id'] }
  );

export type CreateMemberInput = z.input<typeof createMemberSchema>;

export const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
});

export type CreateTeamInput = z.input<typeof createTeamSchema>;
