import { z } from 'zod';

export const deleteTalentFormSchema = z.object({
  serviceId: z.string().uuid(),
});
