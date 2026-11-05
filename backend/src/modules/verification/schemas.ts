import { z } from 'zod';

export const updateVerificationSchema = z.object({
  verificationStatus: z.enum(['PENDING', 'VALID', 'REVISI']),
  verificationNote: z.string().optional(),
});

export type UpdateVerificationInput = z.infer<typeof updateVerificationSchema>;

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(15),
  verificationStatus: z.enum(['PENDING', 'VALID', 'REVISI']).optional(),
  statusKegiatan: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['submittedAt', 'submissionId']).default('submittedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListQueryInput = z.infer<typeof listQuerySchema>;

export const idParamSchema = z.object({ id: z.string().min(1) });