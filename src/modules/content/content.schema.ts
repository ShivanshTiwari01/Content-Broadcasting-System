import { z } from 'zod';

export const uploadContentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  startTime: z.iso.datetime({
    message: 'startTime must be a valid ISO datetime',
  }),
  endTime: z.iso.datetime({ message: 'endTime must be a valid ISO datetime' }),
  rotationDuration: z.coerce.number().int().min(1).default(5), // minutes
});

export type UploadContentInput = z.infer<typeof uploadContentSchema>;
