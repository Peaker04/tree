import { getDefaultEvidenceHasher, type IEvidenceHasher } from './evidenceHasher';

export type EvidenceStage = 'BEFORE' | 'AFTER' | 'COMPLETION' | 'CONDITION' | 'EXCEPTION';

export interface PersistedEvidenceFile {
  id: string;
  taskId: string;
  stage: EvidenceStage;
  sandboxFileUri: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  capturedAt: string;
  isPersistedInSandbox: boolean;
}

export interface SaveEvidenceInput {
  id?: string;
  taskId: string;
  stage: EvidenceStage;
  sourceUri: string;
  fileName?: string;
  contentType?: string;
  capturedAt?: string;
}

export interface RetentionCheckParams {
  syncStatus: string;
  localSubmissionStatus: string;
  hasConflict?: boolean;
}

export interface IEvidenceFileStore {
  persistEvidence(input: SaveEvidenceInput): Promise<PersistedEvidenceFile>;
  fileExists(fileUri: string): Promise<boolean>;
  canSafelyDeleteEvidence(params: RetentionCheckParams): boolean;
  deleteEvidenceFile(fileUri: string, params: RetentionCheckParams): Promise<boolean>;
}

/**
 * Absolute Invariant Enforcer:
 * Never delete evidence that is PENDING_SYNC, SYNCING, SYNC_FAILED,
 * awaiting authoritative acknowledgement, or in conflict.
 */
export function canSafelyDeleteEvidence(params: RetentionCheckParams): boolean {
  const blockedSyncStatuses = ['PENDING_SYNC', 'SYNCING', 'SYNC_FAILED'];
  if (blockedSyncStatuses.includes(params.syncStatus)) {
    return false;
  }
  if (params.localSubmissionStatus === 'PENDING_SYNC') {
    return false;
  }
  if (params.hasConflict) {
    return false;
  }
  return params.syncStatus === 'SYNCED';
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Expo Native File Store implementation.
 */
export class ExpoEvidenceFileStore implements IEvidenceFileStore {
  private hasher: IEvidenceHasher;

  constructor(hasher?: IEvidenceHasher) {
    this.hasher = hasher ?? getDefaultEvidenceHasher();
  }

  async persistEvidence(input: SaveEvidenceInput): Promise<PersistedEvidenceFile> {
    const FileSystem = await import('expo-file-system/legacy');

    const id = input.id ?? generateUuid();
    const fileName = input.fileName ?? `${input.stage.toLowerCase()}_${Date.now()}.jpg`;
    const docDir = FileSystem.documentDirectory ?? 'file:///data/user/0/com.novyx.greenops/files/';
    const targetDir = `${docDir}evidence/${input.taskId}/`;

    // Ensure target directory exists in application sandbox
    const dirInfo = await FileSystem.getInfoAsync(targetDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
    }

    const targetUri = `${targetDir}${fileName}`;

    // Copy from temporary camera cache to sandbox
    await FileSystem.copyAsync({
      from: input.sourceUri,
      to: targetUri,
    });

    const fileInfo = await FileSystem.getInfoAsync(targetUri);
    const sizeBytes = fileInfo.exists && !fileInfo.isDirectory && typeof fileInfo.size === 'number' ? fileInfo.size : 0;
    const sha256 = await this.hasher.hashFile(targetUri);

    return {
      id,
      taskId: input.taskId,
      stage: input.stage,
      sandboxFileUri: targetUri,
      fileName,
      contentType: input.contentType ?? 'image/jpeg',
      sizeBytes,
      sha256,
      capturedAt: input.capturedAt ?? new Date().toISOString(),
      isPersistedInSandbox: true,
    };
  }

  async fileExists(fileUri: string): Promise<boolean> {
    const FileSystem = await import('expo-file-system/legacy');
    const info = await FileSystem.getInfoAsync(fileUri);
    return info.exists;
  }

  canSafelyDeleteEvidence(params: RetentionCheckParams): boolean {
    return canSafelyDeleteEvidence(params);
  }

  async deleteEvidenceFile(fileUri: string, params: RetentionCheckParams): Promise<boolean> {
    if (!this.canSafelyDeleteEvidence(params)) {
      return false;
    }
    const FileSystem = await import('expo-file-system/legacy');
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
    return true;
  }
}

/**
 * Memory / Virtual File Store implementation for tests.
 */
export class InMemoryEvidenceFileStore implements IEvidenceFileStore {
  private files: Map<string, { content: Uint8Array; metadata: PersistedEvidenceFile }> = new Map();
  private hasher: IEvidenceHasher;

  constructor(hasher?: IEvidenceHasher) {
    this.hasher = hasher ?? getDefaultEvidenceHasher();
  }

  async persistEvidence(input: SaveEvidenceInput): Promise<PersistedEvidenceFile> {
    const id = input.id ?? generateUuid();
    const fileName = input.fileName ?? `${input.stage.toLowerCase()}_${Date.now()}.jpg`;
    const sandboxUri = `file:///sandbox/evidence/${input.taskId}/${fileName}`;

    // Simulate binary file content
    const mockContent = new TextEncoder().encode(`evidence-bytes-${input.sourceUri}-${Date.now()}`);
    const sha256 = await this.hasher.hashBytes(mockContent);

    const record: PersistedEvidenceFile = {
      id,
      taskId: input.taskId,
      stage: input.stage,
      sandboxFileUri: sandboxUri,
      fileName,
      contentType: input.contentType ?? 'image/jpeg',
      sizeBytes: mockContent.byteLength,
      sha256,
      capturedAt: input.capturedAt ?? new Date().toISOString(),
      isPersistedInSandbox: true,
    };

    this.files.set(sandboxUri, { content: mockContent, metadata: record });
    return record;
  }

  async fileExists(fileUri: string): Promise<boolean> {
    return this.files.has(fileUri);
  }

  canSafelyDeleteEvidence(params: RetentionCheckParams): boolean {
    return canSafelyDeleteEvidence(params);
  }

  async deleteEvidenceFile(fileUri: string, params: RetentionCheckParams): Promise<boolean> {
    if (!this.canSafelyDeleteEvidence(params)) {
      return false;
    }
    return this.files.delete(fileUri);
  }

  getStoredFile(fileUri: string): { content: Uint8Array; metadata: PersistedEvidenceFile } | undefined {
    return this.files.get(fileUri);
  }
}
