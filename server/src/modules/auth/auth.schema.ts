import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name is too short').max(60),
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(72),
    role: z.enum(['customer', 'owner']).default('customer'),
    businessName: z.string().trim().min(2).max(80).optional(),
    city: z.string().trim().min(2).max(60).optional(),
  })
  .refine((d) => d.role !== 'owner' || (d.businessName && d.city), {
    message: 'Business name and city are required for owners',
    path: ['businessName'],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});
