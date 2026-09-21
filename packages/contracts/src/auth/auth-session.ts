import { z } from 'zod';
import { HumanRoleSchema } from './roles';

export const AuthUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  role: HumanRoleSchema,
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthSessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.string().min(1),
  user: AuthUserSchema,
});

export type AuthSession = z.infer<typeof AuthSessionSchema>;
