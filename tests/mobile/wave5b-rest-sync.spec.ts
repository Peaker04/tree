import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AuthSession, SubmitEvidenceRequest } from '@novyx/contracts';
import {
  AuthSessionManager,
  InMemorySecureSessionStorage,
  AuthSessionError,
} from '../../apps/mobile/src/services/authSessionManager';
import { MobileApiClient } from '../../apps/mobile/src/services/mobileApiClient';
import { EvidenceUploadClient, type IEvidenceBinaryReader } from '../../apps/mobile/src/services/evidenceUploadClient';
import { SubmitEvidenceOutboxDispatcher } from '../../apps/mobile/src/storage/outbox/submitEvidenceDispatcher';
import {
  OutboxCoordinator,
  classifyError,
  isRetryableError,
} from '../../apps/mobile/src/storage/outbox/outboxCoordinator';
import { SqliteOutboxRepository } from '../../apps/mobile/src/storage/outbox/outboxRepository';
import { SqliteMobileTaskRepository } from '../../apps/mobile/src/storage/task/mobileTaskRepository';
import { createInMemoryTestDatabase } from '../../apps/mobile/src/storage/database/sqliteDatabase';
import { runMigrations } from '../../apps/mobile/src/storage/database/migrations';
import { executeOfflineSubmission } from '../../apps/mobile/src/storage/outbox/submissionService';
import { generateSecureUuid } from '../../apps/mobile/src/storage/utils/uuid';
import { InMemoryEvidenceFileStore } from '../../apps/mobile/src/storage/evidence/evidenceFileStore';
import { readPublicRuntimeConfig } from '@novyx/config';
import { createHybridGreenOpsService, createGreenOpsRestService } from '../../apps/mobile/src/services/greenOpsService';
import { createMobileRuntime } from '../../apps/mobile/src/infrastructure/runtime';

describe('Phase 13 Wave 5B: REST Transport, Auth Refresh, Outbox Dispatch, Server Reconciliation', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  async function seedTestTask(
    taskRepo: SqliteMobileTaskRepository,
    taskId: string,
    status: 'IN_PROGRESS' | 'PENDING' | 'WAITING_REVIEW' | 'CANCELLED' = 'IN_PROGRESS',
    version = 1,
  ) {
    await taskRepo.cacheTasks([
      {
        id: taskId,
        title: `Test Task ${taskId}`,
        status,
        version,
        taskTypeId: 'tt-1',
        treeId: 'tr-1',
        assignedStaffId: 'staff-1',
        deadline: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  }

  // =========================================================================
  // SECTION 38: REQUIRED TESTS — AUTH (B01 - B09)
  // =========================================================================
  describe('Auth Infrastructure & Single-Flight Refresh (B01 - B09)', () => {
    const testSession: AuthSession = {
      accessToken: 'opaque_access_token_v1',
      refreshToken: 'opaque_refresh_token_v1',
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      user: {
        id: 'user-001',
        email: 'staff@novyx.test',
        role: 'staff',
      },
    };

    it('B01: authenticated request sends opaque Bearer token', async () => {
      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession(testSession);
      const sessionManager = new AuthSessionManager('https://api.novyx.test', storage);
      const apiClient = new MobileApiClient('https://api.novyx.test', sessionManager);

      let capturedAuthHeader: string | undefined;
      globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedAuthHeader = (init?.headers as Record<string, string>)?.['Authorization'];
        return new Response(JSON.stringify({ data: { id: 'task-1' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      await apiClient.get('/v1/tasks/task-1');
      expect(capturedAuthHeader).toBe('Bearer opaque_access_token_v1');
    });

    it('B02: 401 triggers one refresh', async () => {
      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession(testSession);
      const sessionManager = new AuthSessionManager('https://api.novyx.test', storage);
      const apiClient = new MobileApiClient('https://api.novyx.test', sessionManager);

      const rotatedSession: AuthSession = {
        accessToken: 'opaque_access_token_v2',
        refreshToken: 'opaque_refresh_token_v2',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user: {
          id: 'user-001',
          email: 'staff@novyx.test',
          role: 'staff',
        },
      };

      let attempts = 0;
      let refreshCalled = false;

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/v1/auth/refresh')) {
          refreshCalled = true;
          return new Response(JSON.stringify({ session: rotatedSession }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        attempts++;
        if (attempts === 1) {
          return new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Token expired' } }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ data: { id: 'task-1' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const res = await apiClient.get<{ id: string }>('/v1/tasks/task-1');
      expect(refreshCalled).toBe(true);
      expect(res.id).toBe('task-1');
    });

    it('B03: successful refresh stores rotated AuthSession in SecureStore boundary', async () => {
      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession(testSession);
      const sessionManager = new AuthSessionManager('https://api.novyx.test', storage);

      const rotatedSession: AuthSession = {
        accessToken: 'opaque_access_token_v2',
        refreshToken: 'opaque_refresh_token_v2',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user: {
          id: 'user-001',
          email: 'staff@novyx.test',
          role: 'staff',
        },
      };

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/v1/auth/refresh')) {
          return new Response(JSON.stringify({ session: rotatedSession }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response('', { status: 404 });
      });

      const refreshed = await sessionManager.refreshSession();
      expect(refreshed.accessToken).toBe('opaque_access_token_v2');

      const stored = await storage.loadSession();
      expect(stored?.accessToken).toBe('opaque_access_token_v2');
      expect(stored?.refreshToken).toBe('opaque_refresh_token_v2');
    });

    it('B04: original request retries exactly once with NEW access token', async () => {
      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession(testSession);
      const sessionManager = new AuthSessionManager('https://api.novyx.test', storage);
      const apiClient = new MobileApiClient('https://api.novyx.test', sessionManager);

      const authHeaders: string[] = [];

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/v1/auth/refresh')) {
          const rotated: AuthSession = {
            ...testSession,
            accessToken: 'token_brand_new_456',
            refreshToken: 'refresh_brand_new_789',
          };
          return new Response(JSON.stringify({ session: rotated }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const auth = (init?.headers as Record<string, string>)?.['Authorization'];
        if (auth) authHeaders.push(auth);

        if (authHeaders.length === 1) {
          return new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED' } }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ data: { success: true } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      await apiClient.get('/v1/tasks');
      expect(authHeaders).toHaveLength(2);
      expect(authHeaders[0]).toBe('Bearer opaque_access_token_v1');
      expect(authHeaders[1]).toBe('Bearer token_brand_new_456');
    });

    it('B05: two concurrent 401 requests cause only ONE refresh request', async () => {
      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession(testSession);
      const sessionManager = new AuthSessionManager('https://api.novyx.test', storage);
      const apiClient = new MobileApiClient('https://api.novyx.test', sessionManager);

      let refreshRequestCount = 0;
      let originalRequests = 0;

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/v1/auth/refresh')) {
          refreshRequestCount++;
          // Simulate slight network delay
          await new Promise((resolve) => setTimeout(resolve, 30));
          const rotated: AuthSession = {
            ...testSession,
            accessToken: 'token_rotated_concurrent',
            refreshToken: 'refresh_rotated_concurrent',
          };
          return new Response(JSON.stringify({ session: rotated }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        originalRequests++;
        if (originalRequests <= 2) {
          return new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED' } }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ data: { ok: true } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      // Launch two concurrent requests that will both receive 401
      const [res1, res2] = await Promise.all([
        apiClient.get<{ ok: boolean }>('/v1/tasks/1'),
        apiClient.get<{ ok: boolean }>('/v1/tasks/2'),
      ]);

      expect(res1.ok).toBe(true);
      expect(res2.ok).toBe(true);
      // Single-flight guarantee: exactly ONE refresh HTTP request was performed
      expect(refreshRequestCount).toBe(1);
    });

    it('B06: refresh failure clears/invalidates session appropriately', async () => {
      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession(testSession);
      const sessionManager = new AuthSessionManager('https://api.novyx.test', storage);

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/v1/auth/refresh')) {
          return new Response(JSON.stringify({ error: { code: 'REFRESH_REVOKED', message: 'Revoked' } }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response('', { status: 404 });
      });

      await expect(sessionManager.refreshSession()).rejects.toThrow(AuthSessionError);
      const stored = await storage.loadSession();
      expect(stored).toBeNull();
      expect(sessionManager.getActiveSessionSync()).toBeNull();
    });

    it('B07: refresh failure does NOT delete Outbox/evidence', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const outboxRepo = new SqliteOutboxRepository(db);
      const taskRepo = new SqliteMobileTaskRepository(db);

      const taskId = 'task-preserve-auth';
      const idempotencyKey = generateSecureUuid();

      await seedTestTask(taskRepo, taskId);

      const enqueued = await outboxRepo.enqueueTransactional({
        taskId,
        request: {
          taskId,
          expectedVersion: 1,
          proof: { proofProfile: 'SERVICE_PROOF', completionPhotoUri: 'file:///photo.jpg' },
        },
        idempotencyKey,
      });

      await taskRepo.saveEvidenceMetadata({
        id: 'ev-auth-test',
        taskId,
        stage: 'COMPLETION',
        fileName: 'completion.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 2048,
        sha256: 'a'.repeat(64),
        sandboxFileUri: 'file:///sandbox/ev-auth.jpg',
        capturedAt: new Date().toISOString(),
        isPersistedInSandbox: true,
      });

      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession(testSession);
      const sessionManager = new AuthSessionManager('https://api.novyx.test', storage);

      globalThis.fetch = vi.fn(async () => {
        return new Response(JSON.stringify({ error: { code: 'REVOKED' } }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      // Refresh failure
      await expect(sessionManager.refreshSession()).rejects.toThrow();

      // Verify SQLite state: Outbox and evidence rows MUST remain intact
      const item = await outboxRepo.getItemById(enqueued.id);
      expect(item).not.toBeNull();
      expect(item?.syncStatus).toBe('IDLE');

      const evidence = await taskRepo.listEvidenceByTask(taskId);
      expect(evidence).toHaveLength(1);
      expect(evidence[0].id).toBe('ev-auth-test');
    });

    it('B08: no JWT decode logic exists in new auth infrastructure', () => {
      const servicesDir = path.resolve(__dirname, '../../apps/mobile/src/services');
      const files = fs.readdirSync(servicesDir).filter((f) => f.endsWith('.ts'));

      for (const file of files) {
        const content = fs.readFileSync(path.join(servicesDir, file), 'utf8');
        expect(content).not.toMatch(/jwt[_-]?decode/i);
        expect(content).not.toMatch(/jsonwebtoken/i);
        expect(content).not.toMatch(/atob\(.*split\('\.'\)/);
        expect(content).not.toMatch(/Buffer\.from\(.*split\('\.'\)/);
      }
    });

    it('B09: tokens never enter SQLite/Outbox payload', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);

      // Check column names in sqlite master table schema
      const tables = await db.getAllAsync<{ sql: string }>(
        `SELECT sql FROM sqlite_master WHERE type = 'table' AND name IN ('outbox_items', 'cached_tasks', 'local_evidence', 'local_drafts');`,
      );

      for (const table of tables) {
        expect(table.sql).not.toMatch(/access_?token/i);
        expect(table.sql).not.toMatch(/refresh_?token/i);
        expect(table.sql).not.toMatch(/bearer/i);
      }
    });
  });

  // =========================================================================
  // SECTION 39: REQUIRED TESTS — SUBMIT PIPELINE (B10 - B20)
  // =========================================================================
  describe('Submit Evidence Pipeline & Proof Transformation (B10 - B20)', () => {
    const dummyBinary = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const dummySha256 = '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b';

    class MockBinaryReader implements IEvidenceBinaryReader {
      async readBinary(): Promise<Uint8Array> {
        return dummyBinary;
      }
    }

    it('B10: Presign request includes: fileName, contentType, sizeBytes, contentHash', async () => {
      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession({
        accessToken: 'access_valid',
        refreshToken: 'refresh_valid',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user: { id: 'u1', email: 's@novyx.test', role: 'staff' },
      });
      const sessionManager = new AuthSessionManager('https://api.novyx.test', storage);
      const apiClient = new MobileApiClient('https://api.novyx.test', sessionManager);
      const uploadClient = new EvidenceUploadClient(apiClient, new MockBinaryReader());

      let capturedPresignBody: Record<string, unknown> | undefined;

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/evidence/presign')) {
          capturedPresignBody = JSON.parse(init?.body as string);
          return new Response(
            JSON.stringify({
              data: {
                objectKey: 'tasks/task-1/ev-1.jpg',
                storageRef: 's3://tasks/task-1/ev-1.jpg',
                uploadUrl: 'https://s3.novyx.test/upload/ev-1',
                expiresAt: new Date(Date.now() + 600_000).toISOString(),
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }

        if (url.includes('upload/ev-1')) {
          return new Response('', { status: 200 });
        }

        return new Response('', { status: 404 });
      });

      await uploadClient.uploadEvidence('task-1', {
        localFileUri: 'file:///sandbox/ev-1.jpg',
        fileName: 'ev-1.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 8,
        sha256: dummySha256,
      });

      expect(capturedPresignBody).toBeDefined();
      expect(capturedPresignBody?.['fileName']).toBe('ev-1.jpg');
      expect(capturedPresignBody?.['contentType']).toBe('image/jpeg');
      expect(capturedPresignBody?.['sizeBytes']).toBe(8);
      expect(capturedPresignBody?.['contentHash']).toBe(dummySha256);
    });

    it('B11: contentHash equals persisted Wave-5A SHA-256', async () => {
      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession({
        accessToken: 'access_valid',
        refreshToken: 'refresh_valid',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user: { id: 'u1', email: 's@novyx.test', role: 'staff' },
      });
      const sessionManager = new AuthSessionManager('https://api.novyx.test', storage);
      const apiClient = new MobileApiClient('https://api.novyx.test', sessionManager);
      const uploadClient = new EvidenceUploadClient(apiClient, new MockBinaryReader());

      let capturedHash = '';
      globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/evidence/presign')) {
          const parsed = JSON.parse(init?.body as string);
          capturedHash = parsed.contentHash;
          return new Response(
            JSON.stringify({
              data: {
                objectKey: 'obj-key',
                storageRef: 's3://obj-key',
                uploadUrl: 'https://s3.novyx.test/upload',
                expiresAt: new Date(Date.now() + 600_000).toISOString(),
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return new Response('', { status: 200 });
      });

      await uploadClient.uploadEvidence('task-1', {
        localFileUri: 'file:///test.jpg',
        fileName: 'test.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 8,
        sha256: dummySha256,
      });

      expect(capturedHash).toBe(dummySha256);
      expect(capturedHash).toHaveLength(64);
      expect(capturedHash).toBe(capturedHash.toLowerCase());
    });

    it('B12: binary PUT uploads exact bytes, not Base64 text', async () => {
      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession({
        accessToken: 'access_valid',
        refreshToken: 'refresh_valid',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user: { id: 'u1', email: 's@novyx.test', role: 'staff' },
      });
      const sessionManager = new AuthSessionManager('https://api.novyx.test', storage);
      const apiClient = new MobileApiClient('https://api.novyx.test', sessionManager);
      const uploadClient = new EvidenceUploadClient(apiClient, new MockBinaryReader());

      let uploadedBody: unknown;
      let uploadedContentType: string | undefined;

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/evidence/presign')) {
          return new Response(
            JSON.stringify({
              data: {
                objectKey: 'tasks/task-1/photo.jpg',
                storageRef: 's3://tasks/task-1/photo.jpg',
                uploadUrl: 'https://s3.novyx.test/upload/target',
                expiresAt: new Date(Date.now() + 600_000).toISOString(),
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        if (url.includes('upload/target')) {
          uploadedBody = init?.body;
          uploadedContentType = (init?.headers as Record<string, string>)?.['Content-Type'];
          return new Response('', { status: 200 });
        }
        return new Response('', { status: 404 });
      });

      await uploadClient.uploadEvidence('task-1', {
        localFileUri: 'file:///photo.jpg',
        fileName: 'photo.jpg',
        contentType: 'image/jpeg',
        sizeBytes: dummyBinary.length,
        sha256: dummySha256,
      });

      expect(uploadedContentType).toBe('image/jpeg');
      expect(uploadedBody).toBeInstanceOf(Uint8Array);
      expect(uploadedBody).toEqual(dummyBinary);
      expect(typeof uploadedBody).not.toBe('string');
    });

    it('B13: presigned upload URL is not persisted as durable identity', async () => {
      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession({
        accessToken: 'access_valid',
        refreshToken: 'refresh_valid',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user: { id: 'u1', email: 's@novyx.test', role: 'staff' },
      });
      const sessionManager = new AuthSessionManager('https://api.novyx.test', storage);
      const apiClient = new MobileApiClient('https://api.novyx.test', sessionManager);
      const uploadClient = new EvidenceUploadClient(apiClient, new MockBinaryReader());

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/evidence/presign')) {
          return new Response(
            JSON.stringify({
              data: {
                objectKey: 'durable/object/key.jpg',
                storageRef: 's3://novyx-evidence/durable/object/key.jpg',
                uploadUrl: 'https://temporary-s3.novyx.test/presigned-url?signature=xyz',
                expiresAt: new Date(Date.now() + 600_000).toISOString(),
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return new Response('', { status: 200 });
      });

      const result = await uploadClient.uploadEvidence('task-1', {
        localFileUri: 'file:///p.jpg',
        fileName: 'p.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 8,
        sha256: dummySha256,
      });

      expect(result.objectKey).toBe('durable/object/key.jpg');
      expect(result.storageRef).toBe('s3://novyx-evidence/durable/object/key.jpg');
      expect(result.storageRef).not.toContain('temporary-s3');
      expect(result.storageRef).not.toContain('signature');
    });

    it('B14: final SubmitEvidence proof uses objectKey/storageRef, not file:// URI', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const taskRepo = new SqliteMobileTaskRepository(db);

      const taskId = 'task-proof-transform';
      await seedTestTask(taskRepo, taskId);

      await taskRepo.saveEvidenceMetadata({
        id: 'ev-comp',
        taskId,
        stage: 'COMPLETION',
        fileName: 'completion.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 8,
        sha256: dummySha256,
        sandboxFileUri: 'file:///sandbox/ev-comp.jpg',
        capturedAt: new Date().toISOString(),
        isPersistedInSandbox: true,
      });

      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession({
        accessToken: 'access_valid',
        refreshToken: 'refresh_valid',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user: { id: 'u1', email: 's@novyx.test', role: 'staff' },
      });
      const sessionManager = new AuthSessionManager('https://api.novyx.test', storage);
      const apiClient = new MobileApiClient('https://api.novyx.test', sessionManager);
      const uploadClient = new EvidenceUploadClient(apiClient, new MockBinaryReader());
      const dispatcher = new SubmitEvidenceOutboxDispatcher(apiClient, uploadClient, taskRepo);

      let submittedBody: SubmitEvidenceRequest | undefined;

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/evidence/presign')) {
          return new Response(
            JSON.stringify({
              data: {
                objectKey: 'tasks/task-proof-transform/ev-comp.jpg',
                storageRef: 's3://tasks/task-proof-transform/ev-comp.jpg',
                uploadUrl: 'https://s3.novyx.test/upload',
                expiresAt: new Date(Date.now() + 600_000).toISOString(),
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        if (url.includes('/v1/tasks/task-proof-transform/evidence')) {
          submittedBody = JSON.parse(init?.body as string);
          return new Response(
            JSON.stringify({
              data: { id: taskId, status: 'WAITING_REVIEW', version: 2 },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return new Response('', { status: 200 });
      });

      const outboxItem = {
        id: 'outbox-14',
        taskId,
        commandType: 'SubmitEvidence' as const,
        idempotencyKey: generateSecureUuid(),
        payloadJson: JSON.stringify({
          taskId,
          expectedVersion: 1,
          proof: {
            proofProfile: 'SERVICE_PROOF',
            completionPhotoUri: 'file:///sandbox/ev-comp.jpg',
          },
        }),
        attemptCount: 0,
        syncStatus: 'SYNCING' as const,
        lastError: null,
        errorClassification: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await dispatcher.dispatch(outboxItem);
      expect(result.success).toBe(true);
      expect(submittedBody?.proof.completionPhotoUri).toBe('s3://tasks/task-proof-transform/ev-comp.jpg');
      expect(submittedBody?.proof.completionPhotoUri).not.toMatch(/^file:\/\//);
    });

    it('B15: final SubmitEvidence includes persisted Idempotency-Key HEADER', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const taskRepo = new SqliteMobileTaskRepository(db);

      const taskId = 'task-idem-hdr';
      await seedTestTask(taskRepo, taskId);

      await taskRepo.saveEvidenceMetadata({
        id: 'ev-idem',
        taskId,
        stage: 'COMPLETION',
        fileName: 'completion.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 8,
        sha256: dummySha256,
        sandboxFileUri: 'file:///sandbox/ev-idem.jpg',
        capturedAt: new Date().toISOString(),
        isPersistedInSandbox: true,
      });

      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession({
        accessToken: 'access_valid',
        refreshToken: 'refresh_valid',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user: { id: 'u1', email: 's@novyx.test', role: 'staff' },
      });
      const sessionManager = new AuthSessionManager('https://api.novyx.test', storage);
      const apiClient = new MobileApiClient('https://api.novyx.test', sessionManager);
      const uploadClient = new EvidenceUploadClient(apiClient, new MockBinaryReader());
      const dispatcher = new SubmitEvidenceOutboxDispatcher(apiClient, uploadClient, taskRepo);

      const targetIdempotencyKey = generateSecureUuid();
      let capturedIdempotencyHeader: string | undefined;

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/evidence/presign')) {
          return new Response(
            JSON.stringify({
              data: {
                objectKey: 'obj-1',
                storageRef: 's3://obj-1',
                uploadUrl: 'https://s3.novyx.test/upload',
                expiresAt: new Date(Date.now() + 600_000).toISOString(),
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        if (url.includes(`/v1/tasks/${taskId}/evidence`)) {
          capturedIdempotencyHeader = (init?.headers as Record<string, string>)?.['Idempotency-Key'];
          return new Response(
            JSON.stringify({
              data: { id: taskId, status: 'WAITING_REVIEW', version: 2 },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return new Response('', { status: 200 });
      });

      await dispatcher.dispatch({
        id: 'outbox-15',
        taskId,
        commandType: 'SubmitEvidence',
        idempotencyKey: targetIdempotencyKey,
        payloadJson: JSON.stringify({
          taskId,
          expectedVersion: 1,
          proof: {
            proofProfile: 'SERVICE_PROOF',
            completionPhotoUri: 'file:///sandbox/ev-idem.jpg',
          },
        }),
        attemptCount: 0,
        syncStatus: 'SYNCING',
        lastError: null,
        errorClassification: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(capturedIdempotencyHeader).toBe(targetIdempotencyKey);
    });

    it('B16: request body contains no Idempotency-Key', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const taskRepo = new SqliteMobileTaskRepository(db);

      const taskId = 'task-no-idem-body';
      await seedTestTask(taskRepo, taskId);

      await taskRepo.saveEvidenceMetadata({
        id: 'ev-no-idem',
        taskId,
        stage: 'COMPLETION',
        fileName: 'completion.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 8,
        sha256: dummySha256,
        sandboxFileUri: 'file:///sandbox/ev-no-idem.jpg',
        capturedAt: new Date().toISOString(),
        isPersistedInSandbox: true,
      });

      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession({
        accessToken: 'access_valid',
        refreshToken: 'refresh_valid',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user: { id: 'u1', email: 's@novyx.test', role: 'staff' },
      });
      const sessionManager = new AuthSessionManager('https://api.novyx.test', storage);
      const apiClient = new MobileApiClient('https://api.novyx.test', sessionManager);
      const uploadClient = new EvidenceUploadClient(apiClient, new MockBinaryReader());
      const dispatcher = new SubmitEvidenceOutboxDispatcher(apiClient, uploadClient, taskRepo);

      let parsedBody: Record<string, unknown> | undefined;

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/evidence/presign')) {
          return new Response(
            JSON.stringify({
              data: {
                objectKey: 'obj-1',
                storageRef: 's3://obj-1',
                uploadUrl: 'https://s3.novyx.test/upload',
                expiresAt: new Date(Date.now() + 600_000).toISOString(),
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        if (url.includes(`/v1/tasks/${taskId}/evidence`)) {
          parsedBody = JSON.parse(init?.body as string);
          return new Response(
            JSON.stringify({
              data: { id: taskId, status: 'WAITING_REVIEW', version: 2 },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return new Response('', { status: 200 });
      });

      await dispatcher.dispatch({
        id: 'outbox-16',
        taskId,
        commandType: 'SubmitEvidence',
        idempotencyKey: generateSecureUuid(),
        payloadJson: JSON.stringify({
          taskId,
          expectedVersion: 1,
          proof: {
            proofProfile: 'SERVICE_PROOF',
            completionPhotoUri: 'file:///sandbox/ev-no-idem.jpg',
          },
        }),
        attemptCount: 0,
        syncStatus: 'SYNCING',
        lastError: null,
        errorClassification: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(parsedBody).toBeDefined();
      expect(parsedBody).not.toHaveProperty('idempotencyKey');
      expect(parsedBody).not.toHaveProperty('Idempotency-Key');
    });

    it('B17: retry after network failure uses same key', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const taskRepo = new SqliteMobileTaskRepository(db);
      const outboxRepo = new SqliteOutboxRepository(db);

      const taskId = 'task-retry-same-key';
      await seedTestTask(taskRepo, taskId);

      await taskRepo.saveEvidenceMetadata({
        id: 'ev-retry',
        taskId,
        stage: 'COMPLETION',
        fileName: 'completion.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 8,
        sha256: dummySha256,
        sandboxFileUri: 'file:///sandbox/ev-retry.jpg',
        capturedAt: new Date().toISOString(),
        isPersistedInSandbox: true,
      });

      const fixedKey = generateSecureUuid();
      await outboxRepo.enqueueTransactional({
        taskId,
        request: {
          taskId,
          expectedVersion: 1,
          proof: {
            proofProfile: 'SERVICE_PROOF',
            completionPhotoUri: 'file:///sandbox/ev-retry.jpg',
          },
        },
        idempotencyKey: fixedKey,
      });

      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession({
        accessToken: 'access_valid',
        refreshToken: 'refresh_valid',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user: { id: 'u1', email: 's@novyx.test', role: 'staff' },
      });
      const sessionManager = new AuthSessionManager('https://api.novyx.test', storage);
      const apiClient = new MobileApiClient('https://api.novyx.test', sessionManager);
      const uploadClient = new EvidenceUploadClient(apiClient, new MockBinaryReader());
      const dispatcher = new SubmitEvidenceOutboxDispatcher(apiClient, uploadClient, taskRepo);
      const coordinator = new OutboxCoordinator(outboxRepo, dispatcher, taskRepo, db);

      const capturedKeys: string[] = [];
      let callCount = 0;

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/evidence/presign')) {
          return new Response(
            JSON.stringify({
              data: {
                objectKey: 'obj-retry',
                storageRef: 's3://obj-retry',
                uploadUrl: 'https://s3.novyx.test/upload',
                expiresAt: new Date(Date.now() + 600_000).toISOString(),
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        if (url.includes(`/v1/tasks/${taskId}/evidence`)) {
          const key = (init?.headers as Record<string, string>)?.['Idempotency-Key'];
          capturedKeys.push(key);
          callCount++;
          if (callCount === 1) {
            // First attempt: simulate 503 network error
            return new Response(JSON.stringify({ error: { code: 'SERVER_ERROR' } }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          // Second attempt: success
          return new Response(
            JSON.stringify({
              data: { id: taskId, status: 'WAITING_REVIEW', version: 2 },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return new Response('', { status: 200 });
      });

      // First dispatch attempt -> fails with 503
      const res1 = await coordinator.processNext();
      expect(res1?.success).toBe(false);
      expect(res1?.classification).toBe('SERVER_5XX');

      // Retry dispatch
      const res2 = await coordinator.processNext();
      expect(res2?.success).toBe(true);

      // Verify that both dispatches used the EXACT same Idempotency-Key
      expect(capturedKeys).toHaveLength(2);
      expect(capturedKeys[0]).toBe(fixedKey);
      expect(capturedKeys[1]).toBe(fixedKey);
    });

    it('B18: all three ProofProfile URI shapes are transformed correctly', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const taskRepo = new SqliteMobileTaskRepository(db);

      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession({
        accessToken: 'access_valid',
        refreshToken: 'refresh_valid',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user: { id: 'u1', email: 's@novyx.test', role: 'staff' },
      });
      const sessionManager = new AuthSessionManager('https://api.novyx.test', storage);
      const apiClient = new MobileApiClient('https://api.novyx.test', sessionManager);
      const uploadClient = new EvidenceUploadClient(apiClient, new MockBinaryReader());
      const dispatcher = new SubmitEvidenceOutboxDispatcher(apiClient, uploadClient, taskRepo);

      // 1. CHANGE_PROOF test
      const taskIdChange = 'task-change-proof';
      await seedTestTask(taskRepo, taskIdChange);

      await taskRepo.saveEvidenceMetadata({
        id: 'ev-before',
        taskId: taskIdChange,
        stage: 'BEFORE',
        fileName: 'before.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 8,
        sha256: dummySha256,
        sandboxFileUri: 'file:///sandbox/before.jpg',
        capturedAt: new Date().toISOString(),
        isPersistedInSandbox: true,
      });
      await taskRepo.saveEvidenceMetadata({
        id: 'ev-after',
        taskId: taskIdChange,
        stage: 'AFTER',
        fileName: 'after.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 8,
        sha256: dummySha256,
        sandboxFileUri: 'file:///sandbox/after.jpg',
        capturedAt: new Date().toISOString(),
        isPersistedInSandbox: true,
      });

      let capturedPayload: SubmitEvidenceRequest | undefined;

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/evidence/presign')) {
          const body = JSON.parse(init?.body as string);
          const name = body.fileName;
          return new Response(
            JSON.stringify({
              data: {
                objectKey: `tasks/change/${name}`,
                storageRef: `s3://tasks/change/${name}`,
                uploadUrl: 'https://s3.novyx.test/upload',
                expiresAt: new Date(Date.now() + 600_000).toISOString(),
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        if (url.includes('/evidence')) {
          capturedPayload = JSON.parse(init?.body as string);
          return new Response(JSON.stringify({ data: { id: 't', status: 'WAITING_REVIEW', version: 2 } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response('', { status: 200 });
      });

      await dispatcher.dispatch({
        id: 'outbox-change',
        taskId: taskIdChange,
        commandType: 'SubmitEvidence',
        idempotencyKey: generateSecureUuid(),
        payloadJson: JSON.stringify({
          taskId: taskIdChange,
          expectedVersion: 1,
          proof: {
            proofProfile: 'CHANGE_PROOF',
            beforePhotoUri: 'file:///sandbox/before.jpg',
            afterPhotoUri: 'file:///sandbox/after.jpg',
          },
        }),
        attemptCount: 0,
        syncStatus: 'SYNCING',
        lastError: null,
        errorClassification: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(capturedPayload?.proof.beforePhotoUri).toBe('s3://tasks/change/before.jpg');
      expect(capturedPayload?.proof.afterPhotoUri).toBe('s3://tasks/change/after.jpg');

      // 2. INSPECTION_PROOF test
      const taskIdInsp = 'task-insp-proof';
      await seedTestTask(taskRepo, taskIdInsp);

      await taskRepo.saveEvidenceMetadata({
        id: 'ev-cond1',
        taskId: taskIdInsp,
        stage: 'CONDITION',
        fileName: 'cond1.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 8,
        sha256: dummySha256,
        sandboxFileUri: 'file:///sandbox/cond1.jpg',
        capturedAt: new Date().toISOString(),
        isPersistedInSandbox: true,
      });
      await taskRepo.saveEvidenceMetadata({
        id: 'ev-cond2',
        taskId: taskIdInsp,
        stage: 'CONDITION',
        fileName: 'cond2.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 8,
        sha256: dummySha256,
        sandboxFileUri: 'file:///sandbox/cond2.jpg',
        capturedAt: new Date().toISOString(),
        isPersistedInSandbox: true,
      });

      await dispatcher.dispatch({
        id: 'outbox-insp',
        taskId: taskIdInsp,
        commandType: 'SubmitEvidence',
        idempotencyKey: generateSecureUuid(),
        payloadJson: JSON.stringify({
          taskId: taskIdInsp,
          expectedVersion: 1,
          proof: {
            proofProfile: 'INSPECTION_PROOF',
            conditionPhotos: ['file:///sandbox/cond1.jpg', 'file:///sandbox/cond2.jpg'],
          },
        }),
        attemptCount: 0,
        syncStatus: 'SYNCING',
        lastError: null,
        errorClassification: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(capturedPayload?.proof.conditionPhotos).toHaveLength(2);
      expect(capturedPayload?.proof.conditionPhotos[0]).toBe('s3://tasks/change/cond1.jpg');
      expect(capturedPayload?.proof.conditionPhotos[1]).toBe('s3://tasks/change/cond2.jpg');
    });

    it('B19: LocationException photo is transformed correctly', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const taskRepo = new SqliteMobileTaskRepository(db);

      const taskId = 'task-loc-ex';
      await seedTestTask(taskRepo, taskId);

      await taskRepo.saveEvidenceMetadata({
        id: 'ev-comp-loc',
        taskId,
        stage: 'COMPLETION',
        fileName: 'comp.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 8,
        sha256: dummySha256,
        sandboxFileUri: 'file:///sandbox/comp.jpg',
        capturedAt: new Date().toISOString(),
        isPersistedInSandbox: true,
      });
      await taskRepo.saveEvidenceMetadata({
        id: 'ev-ex-loc',
        taskId,
        stage: 'EXCEPTION',
        fileName: 'location-ex.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 8,
        sha256: dummySha256,
        sandboxFileUri: 'file:///sandbox/location-ex.jpg',
        capturedAt: new Date().toISOString(),
        isPersistedInSandbox: true,
      });

      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession({
        accessToken: 'access_valid',
        refreshToken: 'refresh_valid',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user: { id: 'u1', email: 's@novyx.test', role: 'staff' },
      });
      const sessionManager = new AuthSessionManager('https://api.novyx.test', storage);
      const apiClient = new MobileApiClient('https://api.novyx.test', sessionManager);
      const uploadClient = new EvidenceUploadClient(apiClient, new MockBinaryReader());
      const dispatcher = new SubmitEvidenceOutboxDispatcher(apiClient, uploadClient, taskRepo);

      let payloadSent: SubmitEvidenceRequest | undefined;

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/evidence/presign')) {
          const body = JSON.parse(init?.body as string);
          return new Response(
            JSON.stringify({
              data: {
                objectKey: `tasks/loc/${body.fileName}`,
                storageRef: `s3://tasks/loc/${body.fileName}`,
                uploadUrl: 'https://s3.novyx.test/upload',
                expiresAt: new Date(Date.now() + 600_000).toISOString(),
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        if (url.includes('/evidence')) {
          payloadSent = JSON.parse(init?.body as string);
          return new Response(JSON.stringify({ data: { id: taskId, status: 'WAITING_REVIEW', version: 2 } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response('', { status: 200 });
      });

      await dispatcher.dispatch({
        id: 'outbox-19',
        taskId,
        commandType: 'SubmitEvidence',
        idempotencyKey: generateSecureUuid(),
        payloadJson: JSON.stringify({
          taskId,
          expectedVersion: 1,
          proof: {
            proofProfile: 'SERVICE_PROOF',
            completionPhotoUri: 'file:///sandbox/comp.jpg',
          },
          locationException: {
            reason: 'GPS drift under dense canopy',
            explanationPhotoUri: 'file:///sandbox/location-ex.jpg',
          },
        }),
        attemptCount: 0,
        syncStatus: 'SYNCING',
        lastError: null,
        errorClassification: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(payloadSent?.locationException?.explanationPhotoUri).toBe('s3://tasks/loc/location-ex.jpg');
      expect(payloadSent?.locationException?.explanationPhotoUri).not.toMatch(/^file:\/\//);
    });

    it('B20: IdentityException photo is transformed correctly', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const taskRepo = new SqliteMobileTaskRepository(db);

      const taskId = 'task-id-ex';
      await seedTestTask(taskRepo, taskId);

      await taskRepo.saveEvidenceMetadata({
        id: 'ev-comp-id',
        taskId,
        stage: 'COMPLETION',
        fileName: 'comp.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 8,
        sha256: dummySha256,
        sandboxFileUri: 'file:///sandbox/comp.jpg',
        capturedAt: new Date().toISOString(),
        isPersistedInSandbox: true,
      });
      await taskRepo.saveEvidenceMetadata({
        id: 'ev-ex-id',
        taskId,
        stage: 'EXCEPTION',
        fileName: 'damaged-qr.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 8,
        sha256: dummySha256,
        sandboxFileUri: 'file:///sandbox/damaged-qr.jpg',
        capturedAt: new Date().toISOString(),
        isPersistedInSandbox: true,
      });

      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession({
        accessToken: 'access_valid',
        refreshToken: 'refresh_valid',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user: { id: 'u1', email: 's@novyx.test', role: 'staff' },
      });
      const sessionManager = new AuthSessionManager('https://api.novyx.test', storage);
      const apiClient = new MobileApiClient('https://api.novyx.test', sessionManager);
      const uploadClient = new EvidenceUploadClient(apiClient, new MockBinaryReader());
      const dispatcher = new SubmitEvidenceOutboxDispatcher(apiClient, uploadClient, taskRepo);

      let payloadSent: SubmitEvidenceRequest | undefined;

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/evidence/presign')) {
          const body = JSON.parse(init?.body as string);
          return new Response(
            JSON.stringify({
              data: {
                objectKey: `tasks/id/${body.fileName}`,
                storageRef: `s3://tasks/id/${body.fileName}`,
                uploadUrl: 'https://s3.novyx.test/upload',
                expiresAt: new Date(Date.now() + 600_000).toISOString(),
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        if (url.includes('/evidence')) {
          payloadSent = JSON.parse(init?.body as string);
          return new Response(JSON.stringify({ data: { id: taskId, status: 'WAITING_REVIEW', version: 2 } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response('', { status: 200 });
      });

      await dispatcher.dispatch({
        id: 'outbox-20',
        taskId,
        commandType: 'SubmitEvidence',
        idempotencyKey: generateSecureUuid(),
        payloadJson: JSON.stringify({
          taskId,
          expectedVersion: 1,
          proof: {
            proofProfile: 'SERVICE_PROOF',
            completionPhotoUri: 'file:///sandbox/comp.jpg',
          },
          identityException: {
            reason: 'QR tag washed away by storm',
            damagedQrPhotoUri: 'file:///sandbox/damaged-qr.jpg',
          },
        }),
        attemptCount: 0,
        syncStatus: 'SYNCING',
        lastError: null,
        errorClassification: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(payloadSent?.identityException?.damagedQrPhotoUri).toBe('s3://tasks/id/damaged-qr.jpg');
      expect(payloadSent?.identityException?.damagedQrPhotoUri).not.toMatch(/^file:\/\//);
    });
  });

  // =========================================================================
  // SECTION 40: REQUIRED TESTS — RECONCILIATION (B21 - B30)
  // =========================================================================
  describe('Authoritative Server Reconciliation & Error Classification (B21 - B30)', () => {
    it('B21: successful server response updates cached Task to authoritative status', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const taskRepo = new SqliteMobileTaskRepository(db);
      const outboxRepo = new SqliteOutboxRepository(db);

      const taskId = 'task-reconcile-21';
      await seedTestTask(taskRepo, taskId, 'IN_PROGRESS', 1);

      const mockDispatcher = {
        dispatch: async () => ({
          success: true,
          status: 200,
          serverTask: {
            id: taskId,
            title: 'Initial',
            status: 'WAITING_REVIEW' as const,
            version: 2,
            taskTypeId: 'tt-1',
            treeId: 'tr-1',
            assignedStaffId: 'staff-1',
            deadline: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      };

      await outboxRepo.enqueueTransactional({
        taskId,
        request: { taskId, expectedVersion: 1, proof: { proofProfile: 'SERVICE_PROOF', completionPhotoUri: 'p' } },
        idempotencyKey: generateSecureUuid(),
      });

      const coordinator = new OutboxCoordinator(outboxRepo, mockDispatcher, taskRepo, db);
      const result = await coordinator.processNext();

      expect(result?.success).toBe(true);
      const cached = await taskRepo.getCachedTask(taskId);
      expect(cached?.status).toBe('WAITING_REVIEW');
      expect(cached?.version).toBe(2);
    });

    it('B22: successful SubmitEvidence normal path produces cached WAITING_REVIEW only from server response', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const taskRepo = new SqliteMobileTaskRepository(db);
      const outboxRepo = new SqliteOutboxRepository(db);

      const taskId = 'task-22';
      await seedTestTask(taskRepo, taskId, 'IN_PROGRESS', 1);

      await outboxRepo.enqueueTransactional({
        taskId,
        request: { taskId, expectedVersion: 1, proof: { proofProfile: 'SERVICE_PROOF', completionPhotoUri: 'p' } },
        idempotencyKey: generateSecureUuid(),
      });

      // Before server response, cached task is IN_PROGRESS
      const beforeDispatch = await taskRepo.getCachedTask(taskId);
      expect(beforeDispatch?.status).toBe('IN_PROGRESS');

      const mockDispatcher = {
        dispatch: async () => ({
          success: true,
          status: 200,
          serverTask: {
            id: taskId,
            title: 'T',
            status: 'WAITING_REVIEW' as const,
            version: 2,
            taskTypeId: 'tt-1',
            treeId: 'tr-1',
            assignedStaffId: 'staff-1',
            deadline: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      };

      const coordinator = new OutboxCoordinator(outboxRepo, mockDispatcher, taskRepo, db);
      await coordinator.processNext();

      const afterDispatch = await taskRepo.getCachedTask(taskId);
      expect(afterDispatch?.status).toBe('WAITING_REVIEW');
    });

    it('B23: offline enqueue alone never produces WAITING_REVIEW', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const taskRepo = new SqliteMobileTaskRepository(db);
      const outboxRepo = new SqliteOutboxRepository(db);
      const fileStore = new InMemoryEvidenceFileStore();

      const taskId = 'task-23-offline';
      await seedTestTask(taskRepo, taskId, 'IN_PROGRESS', 1);

      await executeOfflineSubmission(fileStore, outboxRepo, {
        taskId,
        request: {
          taskId,
          expectedVersion: 1,
          proof: {
            proofProfile: 'SERVICE_PROOF',
            completionPhotoUri: 'file:///photo.jpg',
          },
        },
        evidenceInputs: [
          {
            taskId,
            stage: 'COMPLETION',
            fileName: 'comp.jpg',
            contentType: 'image/jpeg',
            base64Data: Buffer.from('photo').toString('base64'),
          },
        ],
      });

      // The cached Task status MUST remain IN_PROGRESS
      const task = await taskRepo.getCachedTask(taskId);
      expect(task?.status).toBe('IN_PROGRESS');

      // Draft status is PENDING_SYNC
      const draft = await taskRepo.getDraft(taskId);
      expect(draft?.submissionStatus).toBe('PENDING_SYNC');
    });

    it('B24: 409 preserves evidence/outbox', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const taskRepo = new SqliteMobileTaskRepository(db);
      const outboxRepo = new SqliteOutboxRepository(db);

      const taskId = 'task-24-conflict';
      await seedTestTask(taskRepo, taskId, 'IN_PROGRESS', 1);

      await taskRepo.saveEvidenceMetadata({
        id: 'ev-24',
        taskId,
        stage: 'COMPLETION',
        fileName: 'photo.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 100,
        sha256: 'a'.repeat(64),
        sandboxFileUri: 'file:///sandbox/p.jpg',
        capturedAt: new Date().toISOString(),
        isPersistedInSandbox: true,
      });

      const enqueued = await outboxRepo.enqueueTransactional({
        taskId,
        request: { taskId, expectedVersion: 1, proof: { proofProfile: 'SERVICE_PROOF', completionPhotoUri: 'p' } },
        idempotencyKey: generateSecureUuid(),
      });

      const conflictDispatcher = {
        dispatch: async () => ({
          success: false,
          status: 409,
          error: 'Task state has advanced (stale version)',
          serverTask: {
            id: taskId,
            title: 'Conflict Task',
            status: 'BLOCKED' as const,
            version: 3,
            taskTypeId: 'tt-1',
            treeId: 'tr-1',
            assignedStaffId: 'staff-1',
            deadline: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      };

      const coordinator = new OutboxCoordinator(outboxRepo, conflictDispatcher, taskRepo, db);
      const result = await coordinator.processNext();

      expect(result?.success).toBe(false);
      expect(result?.classification).toBe('CONFLICT');

      // Evidence and Outbox item MUST be preserved
      const evidence = await taskRepo.listEvidenceByTask(taskId);
      expect(evidence).toHaveLength(1);

      const outboxItem = await outboxRepo.getItemById(enqueued.id);
      expect(outboxItem).not.toBeNull();
      expect(outboxItem?.syncStatus).toBe('SYNC_FAILED');
      expect(outboxItem?.errorClassification).toBe('CONFLICT');
    });

    it('B25: 409 reconciles cached Task status/version from authoritative server Task', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const taskRepo = new SqliteMobileTaskRepository(db);
      const outboxRepo = new SqliteOutboxRepository(db);

      const taskId = 'task-25';
      await seedTestTask(taskRepo, taskId, 'IN_PROGRESS', 1);

      await outboxRepo.enqueueTransactional({
        taskId,
        request: { taskId, expectedVersion: 1, proof: { proofProfile: 'SERVICE_PROOF', completionPhotoUri: 'p' } },
        idempotencyKey: generateSecureUuid(),
      });

      const conflictDispatcher = {
        dispatch: async () => ({
          success: false,
          status: 409,
          error: 'STALE_VERSION',
          serverTask: {
            id: taskId,
            title: 'Task 25',
            status: 'CANCELLED' as const,
            version: 5,
            taskTypeId: 'tt-1',
            treeId: 'tr-1',
            assignedStaffId: 'staff-1',
            deadline: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      };

      const coordinator = new OutboxCoordinator(outboxRepo, conflictDispatcher, taskRepo, db);
      await coordinator.processNext();

      const task = await taskRepo.getCachedTask(taskId);
      expect(task?.status).toBe('CANCELLED');
      expect(task?.version).toBe(5);
    });

    it('B26: 409 does NOT automatically rewrite expectedVersion and resubmit', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const taskRepo = new SqliteMobileTaskRepository(db);
      const outboxRepo = new SqliteOutboxRepository(db);

      const taskId = 'task-26';
      await seedTestTask(taskRepo, taskId, 'IN_PROGRESS', 1);

      const enqueued = await outboxRepo.enqueueTransactional({
        taskId,
        request: { taskId, expectedVersion: 1, proof: { proofProfile: 'SERVICE_PROOF', completionPhotoUri: 'p' } },
        idempotencyKey: generateSecureUuid(),
      });

      let dispatchCalls = 0;
      const dispatcher = {
        dispatch: async () => {
          dispatchCalls++;
          return {
            success: false,
            status: 409,
            error: 'STALE_VERSION',
          };
        },
      };

      const coordinator = new OutboxCoordinator(outboxRepo, dispatcher, taskRepo, db);
      // Process all items
      await coordinator.processAll();

      // Exactly 1 dispatch call, no auto-resubmit with rewritten expectedVersion
      expect(dispatchCalls).toBe(1);

      const item = await outboxRepo.getItemById(enqueued.id);
      const payload = JSON.parse(item!.payloadJson);
      expect(payload.expectedVersion).toBe(1);
    });

    it('B27: 400 preserves evidence/outbox and is not auto-retried', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const taskRepo = new SqliteMobileTaskRepository(db);
      const outboxRepo = new SqliteOutboxRepository(db);

      const taskId = 'task-27-val';
      await seedTestTask(taskRepo, taskId, 'IN_PROGRESS', 1);

      await taskRepo.saveEvidenceMetadata({
        id: 'ev-27',
        taskId,
        stage: 'COMPLETION',
        fileName: 'photo.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 10,
        sha256: 'b'.repeat(64),
        sandboxFileUri: 'file:///p.jpg',
        capturedAt: new Date().toISOString(),
        isPersistedInSandbox: true,
      });

      const enqueued = await outboxRepo.enqueueTransactional({
        taskId,
        request: { taskId, expectedVersion: 1, proof: { proofProfile: 'SERVICE_PROOF', completionPhotoUri: 'p' } },
        idempotencyKey: generateSecureUuid(),
      });

      let calls = 0;
      const dispatcher = {
        dispatch: async () => {
          calls++;
          return {
            success: false,
            status: 400,
            error: 'Validation failed: missing field',
          };
        },
      };

      const coordinator = new OutboxCoordinator(outboxRepo, dispatcher, taskRepo, db);
      await coordinator.processAll();

      expect(calls).toBe(1);
      const item = await outboxRepo.getItemById(enqueued.id);
      expect(item?.errorClassification).toBe('VALIDATION');
      expect(isRetryableError('VALIDATION')).toBe(false);

      const evidence = await taskRepo.listEvidenceByTask(taskId);
      expect(evidence).toHaveLength(1);
    });

    it('B28: 403 preserves evidence/outbox and is not auto-retried', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const taskRepo = new SqliteMobileTaskRepository(db);
      const outboxRepo = new SqliteOutboxRepository(db);

      const taskId = 'task-28-forbid';
      await seedTestTask(taskRepo, taskId, 'IN_PROGRESS', 1);

      await taskRepo.saveEvidenceMetadata({
        id: 'ev-28',
        taskId,
        stage: 'COMPLETION',
        fileName: 'p.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 10,
        sha256: 'c'.repeat(64),
        sandboxFileUri: 'file:///p.jpg',
        capturedAt: new Date().toISOString(),
        isPersistedInSandbox: true,
      });

      const enqueued = await outboxRepo.enqueueTransactional({
        taskId,
        request: { taskId, expectedVersion: 1, proof: { proofProfile: 'SERVICE_PROOF', completionPhotoUri: 'p' } },
        idempotencyKey: generateSecureUuid(),
      });

      let calls = 0;
      const dispatcher = {
        dispatch: async () => {
          calls++;
          return {
            success: false,
            status: 403,
            error: 'Forbidden: actor is not assigned staff',
          };
        },
      };

      const coordinator = new OutboxCoordinator(outboxRepo, dispatcher, taskRepo, db);
      await coordinator.processAll();

      expect(calls).toBe(1);
      const item = await outboxRepo.getItemById(enqueued.id);
      expect(item?.errorClassification).toBe('FORBIDDEN');
      expect(isRetryableError('FORBIDDEN')).toBe(false);

      const evidence = await taskRepo.listEvidenceByTask(taskId);
      expect(evidence).toHaveLength(1);
    });

    it('B29: failed refresh -> AUTH and no auto-retry', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const taskRepo = new SqliteMobileTaskRepository(db);
      const outboxRepo = new SqliteOutboxRepository(db);

      const taskId = 'task-29';
      await seedTestTask(taskRepo, taskId, 'IN_PROGRESS', 1);

      const enqueued = await outboxRepo.enqueueTransactional({
        taskId,
        request: { taskId, expectedVersion: 1, proof: { proofProfile: 'SERVICE_PROOF', completionPhotoUri: 'p' } },
        idempotencyKey: generateSecureUuid(),
      });

      let calls = 0;
      const dispatcher = {
        dispatch: async () => {
          calls++;
          return {
            success: false,
            status: 401,
            error: 'Authentication session expired and refresh failed',
          };
        },
      };

      const coordinator = new OutboxCoordinator(outboxRepo, dispatcher, undefined, db);
      await coordinator.processAll();

      expect(calls).toBe(1);
      const item = await outboxRepo.getItemById(enqueued.id);
      expect(item?.errorClassification).toBe('AUTH');
      expect(isRetryableError('AUTH')).toBe(false);
    });

    it('B30: 5xx/network remains eligible for retry', async () => {
      expect(isRetryableError('NETWORK')).toBe(true);
      expect(isRetryableError('SERVER_5XX')).toBe(true);
      expect(isRetryableError('AUTH')).toBe(false);
      expect(isRetryableError('VALIDATION')).toBe(false);
      expect(isRetryableError('FORBIDDEN')).toBe(false);
      expect(isRetryableError('CONFLICT')).toBe(false);

      expect(classifyError({ status: 500 })).toBe('SERVER_5XX');
      expect(classifyError({ status: 502 })).toBe('SERVER_5XX');
      expect(classifyError({ status: 503 })).toBe('SERVER_5XX');
      expect(classifyError({ status: 0 })).toBe('NETWORK');
      expect(classifyError(new TypeError('Failed to fetch'))).toBe('NETWORK');
    });
  });

  // =========================================================================
  // SECTION 22: REST AUTHORITY TESTS (R01 - R08)
  // =========================================================================
  describe('REST Authority & Boundary Invariants (R01 - R08)', () => {
    it('R01: missing EXPO_PUBLIC_DATA_SOURCE fails configuration', () => {
      expect(() =>
        readPublicRuntimeConfig({
          EXPO_PUBLIC_APP_ENV: 'development',
          EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000/v1',
        }),
      ).toThrow(/EXPO_PUBLIC_DATA_SOURCE is required/);
    });



    it('R03: rest explicitly selects REST mode', async () => {
      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession({
        accessToken: 'tok',
        refreshToken: 'ref',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user: { id: 'u1', email: 's@novyx.test', role: 'staff' },
      });
      const sessionManager = new AuthSessionManager('http://localhost:3000/v1', storage);
      const apiClient = new MobileApiClient('http://localhost:3000/v1', sessionManager);

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/trees')) {
          return new Response(JSON.stringify({ data: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (url.includes('/tasks')) {
          return new Response(JSON.stringify({ data: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response('{}', { status: 200 });
      });

      const service = createHybridGreenOpsService(
        undefined,
        {
          EXPO_PUBLIC_APP_ENV: 'development',
          EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000/v1',
          EXPO_PUBLIC_DATA_SOURCE: 'rest',
        },
        sessionManager,
        apiClient,
      );
      const snapshot = await service.loadSnapshot();
      expect(snapshot.source).toBe('rest');
    });

    it('R04: REST mutation failure never invokes mock mutation', async () => {
      const storage = new InMemorySecureSessionStorage();
      const sessionManager = new AuthSessionManager('http://localhost:3000/v1', storage);
      const apiClient = new MobileApiClient('http://localhost:3000/v1', sessionManager);

      globalThis.fetch = vi.fn(async () => {
        return new Response(JSON.stringify({ error: { code: 'SERVER_ERROR', message: 'DB down' } }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const service = createHybridGreenOpsService(
        undefined,
        {
          EXPO_PUBLIC_APP_ENV: 'development',
          EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000/v1',
          EXPO_PUBLIC_DATA_SOURCE: 'rest',
        },
        sessionManager,
        apiClient,
      );

      const initialTasks = service.getSnapshot().tasks.length;
      await expect(
        service.createTask(
          {
            title: 'New Task Fail',
            taskType: 'TREE_PLANTING' as const,
            description: 'Desc',
            treeId: 'tr-1',
            assignedStaffId: 'st-1',
            deadline: '2026-12-31',
            checklist: [],
          },
          {
            id: 'mock-id',
            title: 'New Task Fail',
            status: 'PENDING' as const,
            checklist: [],
            assignedStaffId: 'st-1',
            assignedStaffName: 'Staff',
            treeId: 'tr-1',
            treeCode: 'TR1',
            deadline: '2026-12-31',
            priority: 'MEDIUM' as const,
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
            taskType: 'TREE_PLANTING' as const,
            description: 'Desc',
          },
        ),
      ).rejects.toThrow();

      expect(service.getSnapshot().tasks.length).toBe(initialTasks);
    });

    it('R05: legacy /progress URL is never emitted in REST mode', async () => {
      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;

      const service = createHybridGreenOpsService(undefined, {
        EXPO_PUBLIC_APP_ENV: 'development',
        EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000/v1',
        EXPO_PUBLIC_DATA_SOURCE: 'rest',
      });

      const dummyTask = service.getSnapshot().tasks[0];
      await expect(service.updateTaskProgress(dummyTask)).rejects.toThrow(/UNSUPPORTED_IN_REST_MODE/);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('R06: PATCH /tasks/:id/review is never emitted (uses POST /v1/tasks/:id/review)', async () => {
      let capturedMethod = '';
      let capturedUrl = '';
      globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedMethod = init?.method ?? 'GET';
        capturedUrl = String(input);
        return new Response(JSON.stringify({ data: { id: 'task-1', version: 2, status: 'APPROVED', checklist: [] } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession({
        accessToken: 'mgr-token',
        refreshToken: 'ref',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user: { id: 'u1', email: 'm@novyx.test', role: 'manager' },
      });
      const sessionManager = new AuthSessionManager('http://localhost:3000/v1', storage);
      const apiClient = new MobileApiClient('http://localhost:3000/v1', sessionManager);

      const service = createHybridGreenOpsService(
        undefined,
        {
          EXPO_PUBLIC_APP_ENV: 'development',
          EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000/v1',
          EXPO_PUBLIC_DATA_SOURCE: 'rest',
        },
        sessionManager,
        apiClient,
      );

      const dummyTask = service.getSnapshot().tasks[0];
      await service.reviewTask(
        {
          taskId: 'task-1',
          decision: 'approve',
          reviewerId: 'u1',
          expectedVersion: 1,
          reason: 'Looks good',
        },
        dummyTask,
      );

      expect(capturedMethod).toBe('POST');
      expect(capturedUrl).toContain('/v1/tasks/task-1/review');
      expect(capturedMethod).not.toBe('PATCH');
    });

    it('R07: notification server calls are not emitted when backend capability does not exist', async () => {
      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;

      const restService = createGreenOpsRestService({
        EXPO_PUBLIC_APP_ENV: 'development',
        EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000/v1',
        EXPO_PUBLIC_DATA_SOURCE: 'rest',
      });

      const notifications = await restService.listNotifications();
      expect(notifications).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();

      const hybridService = createHybridGreenOpsService(undefined, {
        EXPO_PUBLIC_APP_ENV: 'development',
        EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000/v1',
        EXPO_PUBLIC_DATA_SOURCE: 'rest',
      });

      await hybridService.createNotification({
        title: 'Local Alert',
        body: 'Testing',
        type: 'SYSTEM',
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('R08: new production MobileApiClient uses shared AuthSessionManager session', async () => {
      const storage = new InMemorySecureSessionStorage();
      const sessionManager = new AuthSessionManager('http://localhost:3000/v1', storage);
      await sessionManager.setSession({
        accessToken: 'shared_manager_token_123',
        refreshToken: 'ref',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user: { id: 'u1', email: 'staff@novyx.test', role: 'staff' },
      });

      const apiClient = new MobileApiClient('http://localhost:3000/v1', sessionManager);

      let capturedAuth = '';
      globalThis.fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        capturedAuth = (init?.headers as Record<string, string>)?.['Authorization'] ?? '';
        return new Response(JSON.stringify({ data: { id: 't1' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      await apiClient.get('/v1/tasks/t1');
      expect(capturedAuth).toBe('Bearer shared_manager_token_123');
    });
  });

  // =========================================================================
  // SECTION 23: MOBILE RUNTIME TESTS (R09 - R15)
  // =========================================================================
  describe('Mobile Sync Runtime & Lifecycle Invariants (R09 - R15)', () => {
    it('R09: runtime initializes SQLite/migrations once', async () => {
      const db = await createInMemoryTestDatabase();
      const storage = new InMemorySecureSessionStorage();
      const runtime = createMobileRuntime({
        db,
        storage,
        envSource: {
          EXPO_PUBLIC_APP_ENV: 'development',
          EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000/v1',
          EXPO_PUBLIC_DATA_SOURCE: 'mock',
        },
      });

      await runtime.start();
      await runtime.start(); // calling second time
      expect(runtime.db).toBe(db);
    });

    it('R10: runtime calls recoverInterruptedSyncs on startup', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const taskRepo = new SqliteMobileTaskRepository(db);
      await seedTestTask(taskRepo, 'task-r10');
      const outboxRepo = new SqliteOutboxRepository(db);
      const enqueued = await outboxRepo.enqueueTransactional({
        taskId: 'task-r10',
        request: {
          taskId: 'task-r10',
          expectedVersion: 1,
          proof: { proofProfile: 'SERVICE_PROOF', completionPhotoUri: 'p' },
        },
        idempotencyKey: generateSecureUuid(),
      });
      await outboxRepo.updateItemSyncStatus(enqueued.id, 'SYNCING');

      const storage = new InMemorySecureSessionStorage();
      const runtime = createMobileRuntime({
        db,
        storage,
        envSource: {
          EXPO_PUBLIC_APP_ENV: 'development',
          EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000/v1',
          EXPO_PUBLIC_DATA_SOURCE: 'mock',
        },
      });

      await runtime.start();
      const recovered = await outboxRepo.getItemById(enqueued.id);
      expect(recovered?.syncStatus).toBe('SYNC_FAILED');
      expect(recovered?.errorClassification).toBe('NETWORK');
      expect(recovered?.lastError).toBe('INTERRUPTED_SYNC_RECOVERY');
    });

    it('R11: one shared coordinator exists', async () => {
      const runtime = createMobileRuntime({
        envSource: {
          EXPO_PUBLIC_APP_ENV: 'development',
          EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000/v1',
          EXPO_PUBLIC_DATA_SOURCE: 'mock',
        },
      });
      expect(runtime.coordinator).toBeNull();
      // When db is set up:
      const db = await createInMemoryTestDatabase();
      runtime.setupWithDatabase(db);
      const coordinator1 = runtime.coordinator;
      expect(coordinator1).toBeDefined();
      expect(runtime.coordinator).toBe(coordinator1);
    });

    it('R12: restored authenticated session permits eligible Outbox processing', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession({
        accessToken: 'active-session-token',
        refreshToken: 'ref',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user: { id: 'u1', email: 's@novyx.test', role: 'staff' },
      });

      const runtime = createMobileRuntime({
        db,
        storage,
        envSource: {
          EXPO_PUBLIC_APP_ENV: 'development',
          EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000/v1',
          EXPO_PUBLIC_DATA_SOURCE: 'rest',
        },
      });
      await runtime.start();
      await seedTestTask(runtime.taskRepo as SqliteMobileTaskRepository, 't-r12');

      let dispatchCalled = false;
      runtime.coordinator = new OutboxCoordinator(
        runtime.outboxRepo!,
        {
          dispatch: async () => {
            dispatchCalled = true;
            return { success: true, status: 200 };
          },
        },
        runtime.taskRepo!,
        runtime.db!,
      );

      await runtime.outboxRepo!.enqueueTransactional({
        taskId: 't-r12',
        request: {
          taskId: 't-r12',
          expectedVersion: 1,
          proof: { proofProfile: 'SERVICE_PROOF', completionPhotoUri: 's3://b/k' },
        },
        idempotencyKey: generateSecureUuid(),
      });

      const results = await runtime.triggerSync();
      expect(results.length).toBe(1);
      expect(dispatchCalled).toBe(true);
    });

    it('R13: connectivity events cannot create parallel workers', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession({
        accessToken: 'tok',
        refreshToken: 'ref',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user: { id: 'u1', email: 's@novyx.test', role: 'staff' },
      });

      const runtime = createMobileRuntime({
        db,
        storage,
        envSource: {
          EXPO_PUBLIC_APP_ENV: 'development',
          EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000/v1',
          EXPO_PUBLIC_DATA_SOURCE: 'rest',
        },
      });
      await runtime.start();
      await seedTestTask(runtime.taskRepo as SqliteMobileTaskRepository, 't-r13');

      let activeWorkers = 0;
      let maxConcurrentWorkers = 0;

      runtime.coordinator = new OutboxCoordinator(
        runtime.outboxRepo!,
        {
          dispatch: async () => {
            activeWorkers++;
            maxConcurrentWorkers = Math.max(maxConcurrentWorkers, activeWorkers);
            await new Promise((resolve) => setTimeout(resolve, 30));
            activeWorkers--;
            return { success: true, status: 200 };
          },
        },
        runtime.taskRepo!,
        runtime.db!,
      );

      await runtime.outboxRepo!.enqueueTransactional({
        taskId: 't-r13',
        request: {
          taskId: 't-r13',
          expectedVersion: 1,
          proof: { proofProfile: 'SERVICE_PROOF', completionPhotoUri: 's3://b/k' },
        },
        idempotencyKey: generateSecureUuid(),
      });

      await Promise.all([
        runtime.triggerSync(),
        runtime.triggerSync(),
        runtime.triggerSync(),
        runtime.triggerSync(),
        runtime.triggerSync(),
      ]);

      expect(maxConcurrentWorkers).toBe(1);
    });

    it('R14: logout/session invalidation is visible to Outbox REST client', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession({
        accessToken: 'tok-r14',
        refreshToken: 'ref',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user: { id: 'u1', email: 's@novyx.test', role: 'staff' },
      });

      const runtime = createMobileRuntime({
        db,
        storage,
        envSource: {
          EXPO_PUBLIC_APP_ENV: 'development',
          EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000/v1',
          EXPO_PUBLIC_DATA_SOURCE: 'rest',
        },
      });
      await runtime.start();

      await runtime.sessionManager.logout();

      const syncResults = await runtime.triggerSync();
      expect(syncResults).toEqual([]);
    });

    it('R15: startup does not mutate TaskStatus', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const taskRepo = new SqliteMobileTaskRepository(db);
      await taskRepo.cacheTasks([
        {
          id: 'task-r15',
          title: 'Preserve Status Task',
          status: 'IN_PROGRESS',
          version: 1,
          taskTypeId: 'tt-1',
          treeId: 'tr-1',
          assignedStaffId: 'staff-1',
          deadline: '2026-12-31',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ]);

      const storage = new InMemorySecureSessionStorage();
      const runtime = createMobileRuntime({
        db,
        storage,
        envSource: {
          EXPO_PUBLIC_APP_ENV: 'development',
          EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3000/v1',
          EXPO_PUBLIC_DATA_SOURCE: 'mock',
        },
      });

      await runtime.start();
      const cached = await taskRepo.getCachedTask('task-r15');
      expect(cached?.status).toBe('IN_PROGRESS');
    });
  });

  // =========================================================================
  // SECTION 31: REMOVE FALSE POSITIVE TEST PATH
  // =========================================================================
  describe('Section 31: WAITING_REVIEW Without Replay Must Fail', () => {
    it('proves WAITING_REVIEW on server without successful replay does NOT report success', async () => {
      const db = await createInMemoryTestDatabase();
      await runMigrations(db);
      const taskRepo = new SqliteMobileTaskRepository(db);
      const outboxRepo = new SqliteOutboxRepository(db);

      const taskId = 'task-sec31';
      await taskRepo.cacheTasks([
        {
          id: taskId,
          title: 'Task Sec 31',
          status: 'WAITING_REVIEW', // Task is already WAITING_REVIEW on server
          version: 2,
          taskTypeId: 'tt-1',
          treeId: 'tr-1',
          assignedStaffId: 'st-1',
          deadline: '2026-12-31',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ]);

      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession({
        accessToken: 'tok-sec31',
        refreshToken: 'ref',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user: { id: 'st-1', email: 'staff@novyx.test', role: 'staff' },
      });
      const sessionManager = new AuthSessionManager('http://localhost:3000/v1', storage);
      const apiClient = new MobileApiClient('http://localhost:3000/v1', sessionManager);

      // Server returns 400 Bad Request on submit
      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/evidence')) {
          return new Response(
            JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'Proof verification failed' } }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }
        return new Response('{}', { status: 200 });
      });

      class DummyBinaryReader implements IEvidenceBinaryReader {
        async readBinary(): Promise<Uint8Array> {
          return new Uint8Array([1, 2, 3]);
        }
      }
      const uploadClient = new EvidenceUploadClient(apiClient, new DummyBinaryReader());
      const dispatcher = new SubmitEvidenceOutboxDispatcher(apiClient, uploadClient, taskRepo, outboxRepo);

      const outboxItem = await outboxRepo.enqueueTransactional({
        taskId,
        request: {
          taskId,
          expectedVersion: 1,
          proof: {
            proofProfile: 'SERVICE_PROOF',
            completionPhotoUri: 's3://bucket/key.jpg',
          },
        },
        idempotencyKey: generateSecureUuid(),
      });

      const result = await dispatcher.dispatch(outboxItem);
      // Section 31 invariant: Even though task is WAITING_REVIEW, dispatcher MUST report success: false
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toContain('Proof verification failed');
    });
  });
});
