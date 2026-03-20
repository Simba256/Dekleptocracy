import { z } from 'zod/v4';

export const stateRefreshSchema = z.object({
  body: z.object({
    state: z.string().min(1, 'State name is required'),
    waitForCompletion: z.boolean().optional(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});
