import type { PresignedUploadDto, PresignedUploadRequest } from '@novyx/contracts';
import type { MobileApiClient } from './mobileApiClient';
import { base64ToUint8Array } from '../storage/evidence/evidenceHasher';

export interface EvidenceToUpload {
  localFileUri: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
}

export interface UploadResult {
  objectKey: string;
  storageRef: string;
}

export interface IEvidenceBinaryReader {
  readBinary(fileUri: string): Promise<Uint8Array>;
}

export class DefaultEvidenceBinaryReader implements IEvidenceBinaryReader {
  async readBinary(fileUri: string): Promise<Uint8Array> {
    // 1. If running in Node.js environment (e.g. integration test with file on disk)
    if (typeof process !== 'undefined' && process.versions?.node) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fs = require('node:fs');
        const cleanPath = fileUri.replace(/^file:\/\/\/?/, '');
        // On Windows handle drive letters
        const diskPath =
          process.platform === 'win32' && /^[a-zA-Z]:/.test(cleanPath)
            ? cleanPath
            : fileUri.startsWith('file://')
              ? fileUri.slice(7)
              : fileUri;

        if (fs.existsSync(diskPath)) {
          const buffer = fs.readFileSync(diskPath);
          return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        }
      } catch {
        // Fall through to Expo FileSystem
      }
    }

    // 2. Standard Expo FileSystem runtime
    try {
      const FileSystem = await import('expo-file-system/legacy');
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64ToUint8Array(base64);
    } catch (err) {
      throw new Error(
        `Failed to read local evidence binary from ${fileUri}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

export class EvidenceUploadClient {
  private apiClient: MobileApiClient;
  private binaryReader: IEvidenceBinaryReader;

  constructor(apiClient: MobileApiClient, binaryReader?: IEvidenceBinaryReader) {
    this.apiClient = apiClient;
    this.binaryReader = binaryReader ?? new DefaultEvidenceBinaryReader();
  }

  /**
   * Uploads an evidence file to object storage via Presign -> Binary PUT pipeline.
   * Section 13, 14, 15, 16:
   * - Requests presigned upload reservation with exact-byte SHA-256, contentType, size.
   * - Reads exact local binary bytes from sandbox (no Base64, no recompression).
   * - Uploads via HTTP PUT with Content-Type.
   * - Retries with fresh presign if expired.
   * - Returns durable objectKey and storageRef.
   */
  async uploadEvidence(taskId: string, evidence: EvidenceToUpload): Promise<UploadResult> {
    return await this.executePresignAndUpload(taskId, evidence, 1);
  }

  private async executePresignAndUpload(
    taskId: string,
    evidence: EvidenceToUpload,
    attempt: number,
  ): Promise<UploadResult> {
    // Step 1: Request presigned upload reservation
    const presignBody: PresignedUploadRequest = {
      fileName: evidence.fileName,
      contentType: evidence.contentType,
      sizeBytes: evidence.sizeBytes,
      contentHash: evidence.sha256.toLowerCase(),
    };

    const presign = await this.apiClient.post<PresignedUploadDto>(`/v1/tasks/${taskId}/evidence/presign`, presignBody);

    if (!presign?.uploadUrl || !presign?.objectKey) {
      throw new Error(`Invalid presign response from server for task ${taskId}`);
    }

    // Step 2: Read exact local binary bytes from sandbox storage
    const binaryBytes = await this.binaryReader.readBinary(evidence.localFileUri);

    // Step 3: HTTP PUT exact bytes to signed uploadUrl
    // Section 15: Inspect actual generated presigned URL/signed headers and send every required header
    const headers: Record<string, string> = {
      'Content-Type': evidence.contentType,
    };

    try {
      const parsedUrl = new URL(presign.uploadUrl);
      const signedHeaders = (
        parsedUrl.searchParams.get('X-Amz-SignedHeaders') ??
        parsedUrl.searchParams.get('x-amz-signedheaders') ??
        ''
      )
        .toLowerCase()
        .split(';');

      for (const h of signedHeaders) {
        if (h && h !== 'host' && h !== 'content-length') {
          if (h === 'content-type') {
            headers['Content-Type'] = evidence.contentType;
          } else if (parsedUrl.searchParams.has(h)) {
            headers[h] = parsedUrl.searchParams.get(h)!;
          }
        }
      }
    } catch {
      // url parsing fallback
    }

    let putResponse: Response;
    try {
      putResponse = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers,
        body: binaryBytes as unknown as BodyInit,
      });
    } catch (err) {
      throw new Error(
        `Failed to upload binary evidence to object storage: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (!putResponse.ok) {
      // Section 16: Check if failure is due to URL expiry (e.g. 403 / Request has expired) and retry once
      const isExpired = presign.expiresAt && new Date(presign.expiresAt).getTime() <= Date.now();

      if ((isExpired || putResponse.status === 403) && attempt < 2) {
        return await this.executePresignAndUpload(taskId, evidence, attempt + 1);
      }

      throw new Error(
        `Object storage rejected binary upload with HTTP ${putResponse.status}: ${putResponse.statusText}`,
      );
    }

    return {
      objectKey: presign.objectKey,
      storageRef: presign.storageRef ?? `s3://${presign.objectKey}`,
    };
  }
}
