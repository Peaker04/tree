import type { IDurableOutboxRepository } from './outboxRepository';
import type { ErrorClassification, OutboxDispatchResult, OutboxItem } from './types';

export function classifyError(error: unknown): ErrorClassification {
  if (!error) {
    return 'NETWORK';
  }

  if (typeof error === 'object' && error !== null) {
    const status =
      (error as { status?: number; statusCode?: number }).status ??
      (error as { status?: number; statusCode?: number }).statusCode;

    if (typeof status === 'number') {
      if (status === 401) return 'AUTH';
      if (status === 403) return 'FORBIDDEN';
      if (status === 409) return 'CONFLICT';
      if (status >= 400 && status < 500) return 'VALIDATION';
      if (status >= 500) return 'SERVER_5XX';
    }

    const code = (error as { code?: string }).code;
    if (code === 'VALIDATION_FAILED' || code === 'BAD_REQUEST' || code === 'UNPROCESSABLE_ENTITY') return 'VALIDATION';
    if (code === 'CONFLICT' || code === 'VERSION_CONFLICT') return 'CONFLICT';
    if (code === 'UNAUTHORIZED' || code === 'SESSION_EXPIRED') return 'AUTH';
    if (code === 'FORBIDDEN') return 'FORBIDDEN';
    if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') return 'NETWORK';
  }

  if (error instanceof TypeError && error.message.toLowerCase().includes('fetch')) {
    return 'NETWORK';
  }

  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (msg.includes('network') || msg.includes('timeout') || msg.includes('connection') || msg.includes('offline')) {
    return 'NETWORK';
  }

  return 'NETWORK';
}

export function isRetryableError(classification: ErrorClassification): boolean {
  return classification === 'NETWORK' || classification === 'SERVER_5XX';
}

export interface IOutboxDispatcher {
  dispatch(item: OutboxItem): Promise<{
    success: boolean;
    status?: number;
    error?: string;
    serverTask?: unknown;
  }>;
}

export class OutboxCoordinator {
  private repository: IDurableOutboxRepository;
  private dispatcher: IOutboxDispatcher;
  private isProcessing = false;

  constructor(repository: IDurableOutboxRepository, dispatcher: IOutboxDispatcher) {
    this.repository = repository;
    this.dispatcher = dispatcher;
  }

  /**
   * Serialized single executor:
   * Enforces that only one worker/execution processes an outbox item at a time.
   */
  async processNext(): Promise<OutboxDispatchResult | null> {
    if (this.isProcessing) {
      // Locked: another execution is currently processing
      return null;
    }

    this.isProcessing = true;
    try {
      // Fetch oldest eligible item (FIFO)
      const item = await this.repository.getNextEligibleItem();
      if (!item) {
        return null;
      }

      // Mark status as SYNCING before dispatch
      await this.repository.updateItemSyncStatus(item.id, 'SYNCING');

      try {
        const response = await this.dispatcher.dispatch(item);

        if (response.success) {
          // Success: mark outbox item SYNCED
          await this.repository.markCompleted(item.id);

          return {
            outboxId: item.id,
            idempotencyKey: item.idempotencyKey,
            success: true,
            httpStatus: response.status ?? 200,
            serverTask: response.serverTask,
          };
        } else {
          // Dispatcher reported failure
          const classification = classifyError(response);
          await this.repository.updateItemSyncStatus(
            item.id,
            'SYNC_FAILED',
            response.error ?? 'Unknown dispatch failure',
            classification,
          );

          // P13W5A-N09 Invariant: Local evidence metadata is NEVER deleted on sync failure
          return {
            outboxId: item.id,
            idempotencyKey: item.idempotencyKey,
            success: false,
            httpStatus: response.status,
            error: response.error,
            classification,
          };
        }
      } catch (dispatchErr) {
        const classification = classifyError(dispatchErr);
        const errorMessage = dispatchErr instanceof Error ? dispatchErr.message : String(dispatchErr);

        await this.repository.updateItemSyncStatus(item.id, 'SYNC_FAILED', errorMessage, classification);

        // P13W5A-N09 Invariant: Local evidence is preserved
        return {
          outboxId: item.id,
          idempotencyKey: item.idempotencyKey,
          success: false,
          error: errorMessage,
          classification,
        };
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process all pending eligible items sequentially until empty or blocked.
   */
  async processAll(): Promise<OutboxDispatchResult[]> {
    const results: OutboxDispatchResult[] = [];
    while (true) {
      const result = await this.processNext();
      if (!result) {
        break;
      }
      results.push(result);
      // If a non-retryable error occurred, stop processing to prevent spinning
      if (!result.success && result.classification && !isRetryableError(result.classification)) {
        break;
      }
    }
    return results;
  }
}
