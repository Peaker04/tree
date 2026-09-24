import { ExpoEvidenceHasher, getDefaultEvidenceHasher, type IEvidenceHasher } from './evidenceHasher';
import { generateSecureUuid } from '../utils/uuid';

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
  content?: Uint8Array;
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
 * Sanitizes input fileName display hint to prevent directory traversal
 * and ensure it cannot escape the evidence sandbox directory.
 *
 * Normalizes:
 * - strips path separators (/ and \)
 * - strips directory traversal sequences (..)
 * - removes unsafe characters
 * - provides safe fallback if empty or invalid
 */
export function sanitizeEvidenceFileName(rawFileName?: string | null, fallback = 'evidence.jpg'): string {
  if (!rawFileName || typeof rawFileName !== 'string') {
    return fallback;
  }

  // Extract basename after any slash or backslash
  const basename = rawFileName.split(/[/\\]/).pop() ?? '';

  // Strip traversal dots (e.g. .., ..., etc.)
  let cleaned = basename.replace(/\.{2,}/g, '');

  // Strip characters outside safe alphanumeric, dot, underscore, hyphen
  cleaned = cleaned.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Strip leading dots or underscores to avoid hidden files or empty base
  cleaned = cleaned.replace(/^[._]+/, '');

  if (!cleaned.trim()) {
    return fallback;
  }

  return cleaned.trim();
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

/**
 * Expo Native File Store implementation.
 */
export class ExpoEvidenceFileStore implements IEvidenceFileStore {
  private hasher: IEvidenceHasher;

  constructor(hasher?: IEvidenceHasher) {
    this.hasher = hasher ?? new ExpoEvidenceHasher();
  }

  async persistEvidence(input: SaveEvidenceInput): Promise<PersistedEvidenceFile> {
    const FileSystem = await import('expo-file-system/legacy');

    const docDir = FileSystem.documentDirectory;
    if (!docDir) {
      throw new Error('Storage infrastructure error: documentDirectory is unavailable on this device/runtime');
    }

    const id = input.id ?? generateSecureUuid();
    const fallbackName = `${input.stage.toLowerCase()}_evidence.jpg`;
    const sanitizedFileName = sanitizeEvidenceFileName(input.fileName, fallbackName);

    // Section 5 & 5A-R02: Durable path incorporates evidence ID to guarantee collision safety
    const targetDir = `${docDir}evidence/${input.taskId}/`;

    // Ensure target directory exists in application sandbox
    const dirInfo = await FileSystem.getInfoAsync(targetDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
    }

    const durableFileName = `${id}_${sanitizedFileName}`;
    const targetUri = `${targetDir}${durableFileName}`;

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
      fileName: sanitizedFileName,
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
    const id = input.id ?? generateSecureUuid();
    const fallbackName = `${input.stage.toLowerCase()}_evidence.jpg`;
    const sanitizedFileName = sanitizeEvidenceFileName(input.fileName, fallbackName);

    // Section 5 & 5A-R02: Collision-safe URI containing evidence ID
    const durableFileName = `${id}_${sanitizedFileName}`;
    const sandboxUri = `file:///sandbox/evidence/${input.taskId}/${durableFileName}`;

    // Unique binary content per file identity / sourceUri so hashes remain independently tied to exact bytes
    const mockContent = input.content ?? new TextEncoder().encode(`evidence-bytes-${input.sourceUri}-${id}`);
    const sha256 = await this.hasher.hashBytes(mockContent);

    const record: PersistedEvidenceFile = {
      id,
      taskId: input.taskId,
      stage: input.stage,
      sandboxFileUri: sandboxUri,
      fileName: sanitizedFileName,
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
