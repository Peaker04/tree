import { createHash, randomUUID } from 'node:crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { IIdempotencyRepository } from '../../../modules/work-management/application/ports/idempotency-repository.port';
import type { IOperationalUnitOfWork } from '../../../modules/work-management/application/ports/operational-unit-of-work.port';
import { ConflictError, ValidationError } from '../../../core/errors';
import { UUIDV4_REGEX } from '@novyx/contracts';

class ConcurrentClaimError extends Error {
  constructor() {
    super('Concurrent idempotency claim detected');
    this.name = 'ConcurrentClaimError';
  }
}

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
 * Executes a state-mutating operation with PostgreSQL-backed idempotency protection (ADR 0009 / W4-C02 / W4-F02).
 * Idempotency key is read from HTTP header (Idempotency-Key or idempotency-key).
 * When uow is provided, executes claim, business mutation, and completion in ONE crash-safe atomic PostgreSQL transaction.
 * Replays identical requests, rejects conflicting payload hashes with 409 CONFLICT.
 */
export async function executeWithIdempotency<T>(
  request: FastifyRequest,
  reply: FastifyReply,
  idempotencyRepo: IIdempotencyRepository,
  fn: () => Promise<{ status: number; data: T }>,
  uow?: IOperationalUnitOfWork | undefined,
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

  // Check if a completed or in-flight idempotency record already exists
  const existing = await idempotencyRepo.findByKey(actorId, idempotencyKey);
  if (existing) {
    if (existing.requestHash !== requestHash || existing.requestRoute !== requestRoute) {
      throw new ConflictError('Idempotency key reused with different request payload or route', {
        subtype: 'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD',
      });
    }

    if (existing.status === 'COMPLETED' && existing.responseStatus !== null && existing.responseStatus !== undefined) {
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

  // W4-F02: Atomic PostgreSQL transaction covering idempotency claim, business mutation, and completion
  if (uow) {
    try {
      const result = await uow.execute(async (tx) => {
        const claimId = randomUUID();
        const claimed = await tx.idempotencyRepo.claim({
          id: claimId,
          idempotencyKey,
          actorId,
          requestRoute,
          requestHash,
        });

        if (!claimed) {
          throw new ConcurrentClaimError();
        }

        const fnResult = await fn();

        await tx.idempotencyRepo.complete({
          actorId,
          idempotencyKey,
          responseStatus: fnResult.status,
          responseBody: JSON.stringify(fnResult.data),
        });

        return fnResult;
      });

      reply.status(result.status).send(result.data);
      return;
    } catch (err: unknown) {
      const isPgUniqueConflict = (err as { code?: string })?.code === '23505';
      if (err instanceof ConcurrentClaimError || isPgUniqueConflict) {
        // Concurrent transaction claimed or completed: wait and replay committed response
        for (let i = 0; i < 60; i++) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          const polled = await idempotencyRepo.findByKey(actorId, idempotencyKey);
          if (
            polled &&
            polled.status === 'COMPLETED' &&
            polled.responseStatus !== null &&
            polled.responseStatus !== undefined
          ) {
            if (polled.requestHash !== requestHash || polled.requestRoute !== requestRoute) {
              throw new ConflictError('Idempotency key reused with different request payload or route', {
                subtype: 'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD',
              });
            }
            const cachedBody = polled.responseBody ? JSON.parse(polled.responseBody) : {};
            reply.status(polled.responseStatus).send(cachedBody);
            return;
          }
        }
        throw new ConflictError('Concurrent request with this Idempotency-Key is currently being processed');
      }
      throw err;
    }
  }

  // Fallback if no UoW is provided (e.g. in-memory test doubles without DB)
  const claimId = randomUUID();
  const claimed = await idempotencyRepo.claim({
    id: claimId,
    idempotencyKey,
    actorId,
    requestRoute,
    requestHash,
  });

  if (!claimed) {
    const existingFallback = await idempotencyRepo.findByKey(actorId, idempotencyKey);
    if (existingFallback) {
      if (existingFallback.requestHash !== requestHash || existingFallback.requestRoute !== requestRoute) {
        throw new ConflictError('Idempotency key reused with different request payload or route', {
          subtype: 'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD',
        });
      }

      if (
        existingFallback.status === 'COMPLETED' &&
        existingFallback.responseStatus !== null &&
        existingFallback.responseStatus !== undefined
      ) {
        const cachedBody = existingFallback.responseBody ? JSON.parse(existingFallback.responseBody) : {};
        reply.status(existingFallback.responseStatus).send(cachedBody);
        return;
      }
    }
    throw new ConflictError('Concurrent request with this Idempotency-Key is currently being processed');
  }

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
    try {
      await idempotencyRepo.delete(actorId, idempotencyKey);
    } catch {
      // Best-effort cleanup for non-transactional fallback
    }
    throw err;
  }
}
