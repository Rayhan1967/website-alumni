import { z } from 'zod';

export const newsCreateSchema = z.object({
  title: z.string().min(3).max(200),
  excerpt: z.string().min(10),
  content: z.string().min(20),
  category: z.string().min(2).max(50),
  date: z.string().datetime().optional(),
  readTime: z.string().min(1).max(20),
  imageUrl: z.string().url().optional().or(z.literal('')),
  author: z.string().min(2).max(100),
  isPublished: z.boolean().default(true),
});

export type NewsCreateInput = z.infer<typeof newsCreateSchema>;

export const newsUpdateSchema = newsCreateSchema.partial();

export type NewsUpdateInput = z.infer<typeof newsUpdateSchema>;

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(10),
  category: z.string().optional(),
  isPublished: z.coerce.boolean().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['date', 'createdAt', 'title']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListQueryInput = z.infer<typeof listQuerySchema>;

export const idParamSchema = z.object({ id: z.string().cuid() });