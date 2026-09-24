import type { AuthSession } from '@novyx/contracts';
import { readPublicRuntimeConfig } from '@novyx/config';
import type { IDatabaseConnection } from '../storage/database/types';
import { openAppDatabase } from '../storage/database/sqliteDatabase';
import { runMigrations } from '../storage/database/migrations';
import { SqliteMobileTaskRepository, type IMobileTaskRepository } from '../storage/task/mobileTaskRepository';
import { SqliteOutboxRepository, type IDurableOutboxRepository } from '../storage/outbox/outboxRepository';
import { OutboxCoordinator } from '../storage/outbox/outboxCoordinator';
import { SubmitEvidenceOutboxDispatcher } from '../storage/outbox/submitEvidenceDispatcher';
import {
  AuthSessionManager,
  type IAuthSessionManager,
  type ISecureSessionStorage,
} from '../services/authSessionManager';
import { MobileApiClient } from '../services/mobileApiClient';
import {
  EvidenceUploadClient,
  DefaultEvidenceBinaryReader,
  type IEvidenceBinaryReader,
} from '../services/evidenceUploadClient';
import { createHybridGreenOpsService, type GreenOpsService } from '../services/greenOpsService';
import type { OutboxDispatchResult } from '../storage/outbox/types';
import { SqliteAuthenticatedSnapshotCache } from '../storage/cache/authenticatedSnapshotCache';

export interface MobileRuntimeOptions {
  envSource?: Record<string, string | undefined>;
  db?: IDatabaseConnection;
  storage?: ISecureSessionStorage;
  binaryReader?: IEvidenceBinaryReader;
}

function isOperationalMobileRole(role?: string): boolean {
  return role === 'staff' || role === 'manager';
}

export class MobileSyncRuntime {
  public db: IDatabaseConnection | null = null;
  public taskRepo: IMobileTaskRepository | null = null;
  public outboxRepo: IDurableOutboxRepository | null = null;
  public readonly sessionManager: IAuthSessionManager;
  public readonly apiClient: MobileApiClient;
  public readonly uploadClient: EvidenceUploadClient;
  public dispatcher: SubmitEvidenceOutboxDispatcher | null = null;
  public coordinator: OutboxCoordinator | null = null;
  public readonly greenOpsService: GreenOpsService;
  public readonly dataSource = 'rest' as const;

  private envSource: Record<string, string | undefined>;
  private storage?: ISecureSessionStorage;
  private binaryReader: IEvidenceBinaryReader;
  private unsubscribeNetInfo: (() => void) | null = null;
  private isSyncing = false;
  private isStarted = false;
  private startPromise: Promise<AuthSession | null> | null = null;

  constructor(options?: MobileRuntimeOptions) {
    this.envSource = options?.envSource ?? {
      EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
      EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
      EXPO_PUBLIC_DATA_SOURCE: process.env.EXPO_PUBLIC_DATA_SOURCE,
    };
    this.storage = options?.storage;
    this.binaryReader = options?.binaryReader ?? new DefaultEvidenceBinaryReader();

    const config = readPublicRuntimeConfig(this.envSource);
    const apiBaseUrl = config.apiBaseUrl;

    this.sessionManager = new AuthSessionManager(apiBaseUrl, this.storage);
    this.apiClient = new MobileApiClient(apiBaseUrl, this.sessionManager);
    this.uploadClient = new EvidenceUploadClient(this.apiClient, this.binaryReader);
    this.greenOpsService = createHybridGreenOpsService(undefined, this.envSource, this.sessionManager, this.apiClient);

    if (options?.db) {
      this.setupWithDatabase(options.db);
    }
  }

  public setupWithDatabase(db: IDatabaseConnection): void {
    this.db = db;
    this.greenOpsService.setSnapshotCache(new SqliteAuthenticatedSnapshotCache(db));
    this.taskRepo = new SqliteMobileTaskRepository(db);
    this.outboxRepo = new SqliteOutboxRepository(db);
    this.dispatcher = new SubmitEvidenceOutboxDispatcher(
      this.apiClient,
      this.uploadClient,
      this.taskRepo,
      this.outboxRepo,
    );
    this.coordinator = new OutboxCoordinator(this.outboxRepo, this.dispatcher, this.taskRepo, this.db);
  }

  async start(): Promise<AuthSession | null> {
    if (this.isStarted) {
      return await this.sessionManager.getSession();
    }
    if (this.startPromise) {
      return await this.startPromise;
    }

    this.startPromise = (async () => {
      // 1. Open Expo SQLite if not already provided
      if (!this.db) {
        const db = await openAppDatabase();
        this.setupWithDatabase(db);
      } else {
        // Run migrations and recovery on provided DB
        await runMigrations(this.db);
        if (this.outboxRepo) {
          await this.outboxRepo.recoverInterruptedSyncs();
        }
      }

      // 4. Restore SecureStore AuthSession
      const session = this.sessionManager.initialize
        ? await this.sessionManager.initialize()
        : await this.sessionManager.getSession();

      // 5. Establish NetInfo subscription
      try {
        const NetInfo = await import('@react-native-community/netinfo');
        const netInfoMod =
          (
            NetInfo as unknown as {
              default?: { addEventListener?: (listener: (state: unknown) => void) => () => void };
            }
          ).default ?? NetInfo;
        if (typeof (netInfoMod as { addEventListener?: unknown }).addEventListener === 'function') {
          this.unsubscribeNetInfo = (
            netInfoMod as {
              addEventListener: (
                listener: (state: { isConnected?: boolean; isInternetReachable?: boolean }) => void,
              ) => () => void;
            }
          ).addEventListener((state) => {
            if (state?.isConnected && state?.isInternetReachable !== false) {
              void this.triggerSync();
            }
          });
        }
      } catch {
        // Fallback for non-native / test environments
      }

      this.isStarted = true;

      // 6. If authenticated and connectivity permits: process eligible Outbox sequentially
      if (session?.accessToken) {
        void this.triggerSync();
      }

      return session;
    })();

    try {
      return await this.startPromise;
    } finally {
      this.startPromise = null;
    }
  }

  async stop(): Promise<void> {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
    this.isStarted = false;
  }

  async triggerSync(): Promise<OutboxDispatchResult[]> {
    if (this.isSyncing || !this.coordinator) {
      return [];
    }

    this.isSyncing = true;
    try {
      const session = await this.sessionManager.getSession();
      if (!session?.accessToken) {
        return [];
      }
      if (!isOperationalMobileRole(session.user?.role)) {
        return [];
      }
      return await this.coordinator.processAll();
    } finally {
      this.isSyncing = false;
    }
  }
}

let sharedRuntimeInstance: MobileSyncRuntime | null = null;

export function createMobileRuntime(options?: MobileRuntimeOptions): MobileSyncRuntime {
  return new MobileSyncRuntime(options);
}

export function getSharedMobileRuntime(options?: MobileRuntimeOptions): MobileSyncRuntime {
  if (!sharedRuntimeInstance) {
    sharedRuntimeInstance = createMobileRuntime(options);
  }
  return sharedRuntimeInstance;
}

export function resetSharedMobileRuntime(): void {
  if (sharedRuntimeInstance) {
    void sharedRuntimeInstance.stop();
    sharedRuntimeInstance = null;
  }
}
