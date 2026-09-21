/**
 * Provider-neutral Object Storage Port (Phase 13 Wave 4 - IDB-07)
 * Defines S3-compatible object storage operations without leaking provider SDK types.
 */
export interface PresignedUploadResult {
  objectKey: string;
  storageRef: string;
  uploadUrl: string;
  expiresAt: Date;
}

export interface ObjectMetadata {
  sizeBytes: number;
  contentType: string;
  contentHash?: string | undefined;
  etag?: string | undefined;
}

export interface IObjectStoragePort {
  generatePresignedUploadUrl(params: {
    taskId: string;
    actorId: string;
    fileName: string;
    contentType: string;
    expiresInSeconds?: number | undefined;
  }): Promise<PresignedUploadResult>;

  generatePresignedDownloadUrl(objectKey: string, expiresInSeconds?: number | undefined): Promise<string>;

  getObjectMetadata(objectKey: string): Promise<ObjectMetadata | null>;

  deleteObject(objectKey: string): Promise<void>;

  putObjectDirect?(params: {
    objectKey: string;
    data: Buffer;
    contentType: string;
  }): Promise<{ contentHash?: string; etag?: string }>;
}
