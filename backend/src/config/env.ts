import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  API_PREFIX: z.string().default('/api/v1'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi'),

  // JWT — access and refresh MUST use different secrets
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET minimal 32 karakter'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET minimal 32 karakter'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Cookie signing secret (separate from JWT)
  COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET minimal 32 karakter').default('CookieSecretDefault32CharsMust!!'),

  FRONTEND_URL: z.string().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(5 * 1024 * 1024),
  SEED_ADMIN_EMAIL: z.string().email().default('admin@smksasmitajaya2.sch.id'),
  SEED_ADMIN_PASSWORD: z.string().min(6).default('Admin#12345'),
  SEED_ADMIN_NISN: z.string().default('0000000000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`\n[ENV] Konfigurasi environment tidak valid:\n${issues}\n`);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  corsOrigins: parsed.data.FRONTEND_URL.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

export type Env = typeof env;
