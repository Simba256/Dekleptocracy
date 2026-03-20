import { z } from 'zod/v4';

export const signupSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, 'Full name is required').max(100),
    email: z.email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    agreeToTerms: z.literal(true, { error: 'You must agree to terms and conditions' }),
    preferences: z.object({
      conversationStyles: z.array(z.string()).optional(),
      topicsOfInterest: z.array(z.string()).optional(),
      householdExpenseFocus: z.string().optional(),
    }).optional(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});
