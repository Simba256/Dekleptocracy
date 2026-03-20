import { z } from 'zod/v4';

const CATEGORIES = ['groceries', 'fuel', 'utilities', 'tech', 'housing', 'healthcare', 'education', 'transportation'];

export const createArticleSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    slug: z.string().optional(),
    contentType: z.enum(['article', 'research']).optional(),
    category: z.enum(CATEGORIES),
    heroImage: z.string().url('Hero image must be a valid URL'),
    description: z.string().min(1, 'Description is required'),
    mainText: z.string().min(1, 'Main text is required'),
    price: z.string().min(1),
    priceUnit: z.string().min(1),
    priceChange: z.string().min(1),
    impactScore: z.number().min(0).max(100),
    impactLevel: z.enum(['low', 'medium', 'high', 'critical']),
  }).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateArticleSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    category: z.enum(CATEGORIES).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
  }).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({
    id: z.string().min(1),
  }),
});
