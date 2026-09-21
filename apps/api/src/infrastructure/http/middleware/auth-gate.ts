import type { FastifyRequest, FastifyReply } from 'fastify';
import type { IUserRepository } from '../../../modules/iam/application/ports/user-repository.port';
import type { ISessionRepository } from '../../../modules/iam/application/ports/session-repository.port';
import type { ITokenService } from '../../../modules/iam/application/ports/token-service.port';
import type { HumanRole } from '@novyx/contracts';
import { UnauthorizedError, ForbiddenError } from '../../../core/errors';

export interface AuthenticatedActor {
  id: string;
  email: string;
  role: HumanRole;
  authVersion: number;
  sessionId: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    actor?: AuthenticatedActor;
  }
}

export function createAuthGate(
  userRepository: IUserRepository,
  sessionRepository: ISessionRepository,
  tokenService: ITokenService,
) {
  return async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new UnauthorizedError('Missing bearer token');
    }

    // 1. Derive secure lookup hash
    const tokenHash = tokenService.hashToken(token);

    // 2. Resolve session by hash
    const session = await sessionRepository.findSessionByAccessTokenHash(tokenHash);
    if (!session) {
      throw new UnauthorizedError('Invalid access token');
    }

    // 3. Verify access expiry
    if (session.accessExpiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedError('Access token expired');
    }

    // 4. Verify session not revoked
    if (session.revokedAt !== null) {
      throw new UnauthorizedError('Session has been revoked');
    }

    // 5. Authoritative user lookup
    const user = await userRepository.findById(session.userId);
    if (!user) {
      throw new UnauthorizedError('User account not found');
    }

    // 6. Verify AccountStatus == ACTIVE
    if (user.accountStatus !== 'ACTIVE') {
      throw new ForbiddenError(`Account is ${user.accountStatus.toLowerCase()}`);
    }

    // 7. Verify authVersion freshness
    if (session.authVersion !== user.authVersion) {
      throw new UnauthorizedError('Authorization version mismatch');
    }

    // 8. Establish actor context
    request.actor = {
      id: user.id,
      email: user.email,
      role: user.role,
      authVersion: user.authVersion,
      sessionId: session.id,
    };
  };
}

export function requireRoles(...allowedRoles: HumanRole[]) {
  return async function checkRoles(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    if (!request.actor) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!allowedRoles.includes(request.actor.role)) {
      throw new ForbiddenError(`Role '${request.actor.role}' is not authorized for this resource`);
    }
  };
}
