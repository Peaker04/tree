import { createHash, randomUUID } from 'node:crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { IIdempotencyRepository } from '../../../modules/work-management/application/ports/idempotency-repository.port';
import { ConflictError, ValidationError } from '../../../core/errors';
import { UUIDV4_REGEX } from '@novyx/contracts';

/**
 * Deterministically stringifies any object with alphabetically sorted keys.
 * Immune to key ordering differences in incoming JSON payloads.
 */
function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJson).join(',') + ']';
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',') + '}';
}

/**
 * Executes a state-mutating operation with PostgreSQL-backed idempotency protection (ADR 0009 / W4-C02).
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

  // ADR 0009: Idempotency-Key is mandatory for state-changing commands
  if (!rawKey) {
    throw new ValidationError(
      'Idempotency-Key header is required for state-changing commands and must be a valid RFC 4122 UUIDv4',
    );
  }

  const idempotencyKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;
  if (!idempotencyKey || !UUIDV4_REGEX.test(idempotencyKey)) {
    throw new ValidationError('Idempotency-Key header must be a valid RFC 4122 UUIDv4');
  }

  const actorId = request.actor?.id ?? 'anonymous';
  const requestRoute = request.routeOptions?.url ?? request.url;
  const requestHash = createHash('sha256')
    .update(`${actorId}:${requestRoute}:${canonicalJson(request.body ?? {})}`)
    .digest('hex');

  // Attempt database-level unique claim for (actorId, idempotencyKey)
  const claimId = randomUUID();
  const claimed = await idempotencyRepo.claim({
    id: claimId,
    idempotencyKey,
    actorId,
    requestRoute,
    requestHash,
  });

  if (!claimed) {
    // Record already exists for this actor and key
    const existing = await idempotencyRepo.findByKey(actorId, idempotencyKey);
    if (existing) {
      if (existing.requestHash !== requestHash || existing.requestRoute !== requestRoute) {
        throw new ConflictError('Idempotency key reused with different request payload or route', {
          subtype: 'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD',
        });
      }

      if (
        existing.status === 'COMPLETED' &&
        existing.responseStatus !== null &&
        existing.responseStatus !== undefined
      ) {
        const cachedBody = existing.responseBody ? JSON.parse(existing.responseBody) : {};
        reply.status(existing.responseStatus).send(cachedBody);
        return;
      }

      // In flight by concurrent request (PROCESSING): wait for completion and replay
      for (let i = 0; i < 60; i++) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const polled = await idempotencyRepo.findByKey(actorId, idempotencyKey);
        if (
          polled &&
          polled.status === 'COMPLETED' &&
          polled.responseStatus !== null &&
          polled.responseStatus !== undefined
        ) {
          const cachedBody = polled.responseBody ? JSON.parse(polled.responseBody) : {};
          reply.status(polled.responseStatus).send(cachedBody);
          return;
        }
      }

      throw new ConflictError('Concurrent request with this Idempotency-Key is currently being processed');
    }
  }

  // Current request holds the PROCESSING claim
  try {
    const result = await fn();
    await idempotencyRepo.complete({
      actorId,
      idempotencyKey,
      responseStatus: result.status,
      responseBody: JSON.stringify(result.data),
    });
    reply.status(result.status).send(result.data);
  } catch (err) {
    // Mutation failed/rolled back: clean up PROCESSING claim so client may retry
    try {
      await idempotencyRepo.delete(actorId, idempotencyKey);
    } catch {
      // Best-effort cleanup
    }
    throw err;
  }
}
