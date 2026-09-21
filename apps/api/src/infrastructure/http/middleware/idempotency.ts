import { createHash, randomUUID } from 'node:crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { IIdempotencyRepository } from '../../../modules/work-management/application/ports/idempotency-repository.port';
import { ConflictError, ValidationError } from '../../../core/errors';
import { UUIDV4_REGEX } from '@novyx/contracts';

/**
 * Executes a state-mutating operation with PostgreSQL-backed idempotency protection (ADR 0009).
 * Idempotency key is read from HTTP header (Idempotency-Key or idempotency-key).
 * Replays identical requests, rejects conflicting payload hashes with 409 CONFLICT.
 */
export async function executeWithIdempotency<T>(
  request: FastifyRequest,
  reply: FastifyReply,
  idempotencyRepo: IIdempotencyRepository,
  fn: () => Promise<{ status: number; data: T }>,
): Promise<void> {
  const rawKey = (request.headers['idempotency-key'] || request.headers['Idempotency-Key']) as string | undefined;

  // If no idempotency key is provided, execute directly
  if (!rawKey) {
    const result = await fn();
    reply.status(result.status).send(result.data);
    return;
  }

  const idempotencyKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;
  if (!UUIDV4_REGEX.test(idempotencyKey)) {
    throw new ValidationError('Idempotency-Key header must be a valid RFC 4122 UUIDv4');
  }

  const actorId = request.actor?.id ?? 'anonymous';
  const requestRoute = request.routeOptions?.url ?? request.url;
  const requestHash = createHash('sha256')
    .update(JSON.stringify(request.body ?? {}))
    .digest('hex');

  // Check existing idempotency record
  const existing = await idempotencyRepo.findByKey(actorId, idempotencyKey);
  if (existing) {
    if (existing.requestHash !== requestHash || existing.requestRoute !== requestRoute) {
      throw new ConflictError('Idempotency key reused with different request payload or route');
    }
    // Replay cached response
    const cachedBody = JSON.parse(existing.responseBody);
    reply.status(existing.responseStatus).send(cachedBody);
    return;
  }

  // Execute mutation
  const result = await fn();

  // Save committed response
  await idempotencyRepo.save({
    id: randomUUID(),
    idempotencyKey,
    actorId,
    requestRoute,
    requestHash,
    responseStatus: result.status,
    responseBody: JSON.stringify(result.data),
    createdAt: new Date(),
  });

  reply.status(result.status).send(result.data);
}
