import { describe, it, expect, vi } from 'vitest';
import { SubmitEvidenceOutboxDispatcher } from '../../apps/mobile/src/storage/outbox/submitEvidenceDispatcher';
import type { SubmitEvidenceRequest } from '@novyx/contracts';
import type { OutboxItem } from '../../apps/mobile/src/storage/outbox/outboxRepository';

describe('OutboxResilience', () => {
  describe('transformProofUris', () => {
    it('correctly maps locationException explanationPhotoUri to BEFORE durable ref when raw cache URI is used', async () => {
      const mockApiClient = {
        post: vi.fn().mockResolvedValue({ id: 'task-1', status: 'WAITING_REVIEW' }),
      };
      const mockUploadClient = {
        uploadEvidence: vi.fn().mockResolvedValue({
          objectKey: 'evidence/task-1/before.jpg',
          storageRef: 's3://evidence/task-1/before.jpg',
        }),
      };
      const mockTaskRepo = {
        getTaskById: vi.fn(),
        getCachedTask: vi.fn().mockResolvedValue({ id: 'task-1', status: 'IN_PROGRESS', version: 1 }),
        cacheTasks: vi.fn(),
        listEvidenceByTask: vi.fn().mockResolvedValue([
          {
            id: 'ev-1',
            taskId: 'task-1',
            stage: 'BEFORE',
            sandboxFileUri: 'file:///sandbox/evidence/task-1/before.jpg',
            fileName: 'before.jpg',
            contentType: 'image/jpeg',
            sizeBytes: 250000,
            sha256: 'abc123hash',
          },
        ]),
      };

      const dispatcher = new SubmitEvidenceOutboxDispatcher(
        mockApiClient as unknown as Parameters<typeof SubmitEvidenceOutboxDispatcher.prototype.constructor>[0],
        mockUploadClient as unknown as Parameters<typeof SubmitEvidenceOutboxDispatcher.prototype.constructor>[1],
        mockTaskRepo as unknown as Parameters<typeof SubmitEvidenceOutboxDispatcher.prototype.constructor>[2],
      );

      const request: SubmitEvidenceRequest = {
        taskId: 'task-1',
        expectedVersion: 1,
        siteVerification: {
          qrCheck: { verified: true, code: 'QR-1', matched: true, timestamp: new Date().toISOString() },
        },
        locationException: {
          reason: 'Tán cây rậm rạp',
          distanceMeters: 50,
          explanationPhotoUri: 'file:///data/user/0/com.novyx.greenops/cache/ImageManipulator/raw_999.jpg',
          recordedLat: 10.7,
          recordedLng: 106.6,
          timestamp: new Date().toISOString(),
        },
        proof: {
          proofProfile: 'CHANGE_PROOF',
          beforePhotoUri: 'file:///data/user/0/com.novyx.greenops/cache/ImageManipulator/raw_999.jpg',
          afterPhotoUri: 'file:///sandbox/evidence/task-1/before.jpg',
          checklist: [{ id: 'chk-1', text: 'Safety', done: true }],
        },
      };

      const item: OutboxItem = {
        id: 'outbox-1',
        taskId: 'task-1',
        commandType: 'SubmitEvidence',
        payloadJson: JSON.stringify(request),
        idempotencyKey: 'idemp-1',
        attemptCount: 0,
        syncStatus: 'IDLE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await dispatcher.dispatch(item);

      expect(result.success).toBe(true);
      expect(mockApiClient.post).toHaveBeenCalledTimes(1);
      const dispatchedBody = mockApiClient.post.mock.calls[0][1] as SubmitEvidenceRequest;
      expect(dispatchedBody.locationException?.explanationPhotoUri).toBe('s3://evidence/task-1/before.jpg');
      expect(dispatchedBody.locationException?.explanationPhotoUri).not.toContain('file:///');
    });
  });

  describe('Head-of-Line isolation and retry threshold', () => {
    it('skips outbox items that have reached max retry attempts (3) or DEAD_LETTER status', async () => {
      const { SqliteOutboxRepository } = await import('../../apps/mobile/src/storage/outbox/outboxRepository');

      const mockDb = {
        getFirstAsync: vi.fn().mockImplementation((query: string) => {
          expect(query).toContain('attempt_count < 3');
          expect(query).toContain('DEAD_LETTER');
          return Promise.resolve(null);
        }),
        runAsync: vi.fn(),
        withTransactionAsync: vi.fn((fn: () => unknown) => fn()),
      };

      const repo = new SqliteOutboxRepository(
        mockDb as unknown as Parameters<typeof SqliteOutboxRepository.prototype.constructor>[0],
      );
      const eligible = await repo.getNextEligibleItem();

      expect(eligible).toBeNull();
      expect(mockDb.getFirstAsync).toHaveBeenCalledTimes(1);
    });
  });
});
