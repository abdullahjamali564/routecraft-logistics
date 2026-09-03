import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/smart-logistics'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  N8N_BASE_URL: z.string().url().optional(),
  N8N_WEBHOOK_SECRET: z.string().min(16).optional(),
  DISPATCH_RADIUS_METERS: z.coerce.number().int().positive().default(5000),
  PROXIMITY_RADIUS_METERS: z.coerce.number().int().positive().default(1000)
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  N8N_BASE_URL: process.env.N8N_BASE_URL,
  N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET,
  DISPATCH_RADIUS_METERS: process.env.DISPATCH_RADIUS_METERS,
  PROXIMITY_RADIUS_METERS: process.env.PROXIMITY_RADIUS_METERS
});
