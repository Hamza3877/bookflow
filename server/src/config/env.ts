import 'dotenv/config';
import { z } from 'zod';

// All settings come from the .env file. We validate them once at startup,
// so a missing value fails loudly here instead of breaking somewhere later.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be 16+ characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be 16+ characters'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  CROSS_SITE_COOKIES: z.enum(['true', 'false']).default('false'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment settings in server/.env:');
  parsed.error.issues.forEach((i) => console.error(` - ${i.path.join('.')}: ${i.message}`));
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const stripeEnabled = Boolean(env.STRIPE_SECRET_KEY);
export const aiEnabled = Boolean(env.GEMINI_API_KEY);
