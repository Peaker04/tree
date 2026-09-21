import { z } from 'zod';

export const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_MIGRATION_URL: z.string().optional(),
  DATABASE_RUNTIME_URL: z.string().optional(),

  // Wave 3 Security Configuration
  AUTH_ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  AUTH_REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(2592000),
  AUTH_FAILED_LOGIN_LOCK_THRESHOLD: z.coerce.number().int().positive().default(5),
  AUTH_LOCK_DURATION_SECONDS: z.coerce.number().int().positive().default(900),
  AUTH_SETUP_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(86400),
  ARGON2_MEMORY_COST: z.coerce.number().int().positive().default(65536),
  ARGON2_TIME_COST: z.coerce.number().int().positive().default(3),
  ARGON2_PARALLELISM: z.coerce.number().int().positive().default(4),
});

export type Env = z.infer<typeof EnvSchema>;

export interface SecurityConfig {
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  failedLoginLockThreshold: number;
  lockDurationSeconds: number;
  setupTokenTtlSeconds: number;
  argon2: {
    memoryCost: number;
    timeCost: number;
    parallelism: number;
  };
}

export function getSecurityConfig(env: Env): SecurityConfig {
  return {
    accessTokenTtlSeconds: env.AUTH_ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenTtlSeconds: env.AUTH_REFRESH_TOKEN_TTL_SECONDS,
    failedLoginLockThreshold: env.AUTH_FAILED_LOGIN_LOCK_THRESHOLD,
    lockDurationSeconds: env.AUTH_LOCK_DURATION_SECONDS,
    setupTokenTtlSeconds: env.AUTH_SETUP_TOKEN_TTL_SECONDS,
    argon2: {
      memoryCost: env.ARGON2_MEMORY_COST,
      timeCost: env.ARGON2_TIME_COST,
      parallelism: env.ARGON2_PARALLELISM,
    },
  };
}

export function loadEnv(): Env {
  return EnvSchema.parse(process.env);
}
