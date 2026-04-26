import { z } from 'zod';

export const approveSchema = z.object({});

export const rejectSchema = z.object({
  rejectionReason: z
    .string()
    .min(5, 'Please provide a meaningful rejection reason'),
});

export type RejectInput = z.infer<typeof rejectSchema>;
