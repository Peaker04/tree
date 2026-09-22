import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID, createHash } from 'node:crypto';
import type {
  IObjectStoragePort,
  PresignedUploadResult,
  ObjectMetadata,
  ObjectIntegrity,
} from '../../modules/work-management/application/ports/object-storage.port';
import type { StorageConfig } from '../../config/env';

export class S3ObjectStorageAdapter implements IObjectStoragePort {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: StorageConfig) {
    this.bucket = config.bucket;

    const s3Config: S3ClientConfig = {
      region: config.region,
      forcePathStyle: config.forcePathStyle,
    };

    if (config.endpoint) {
      s3Config.endpoint = config.endpoint;
    }

    if (config.accessKeyId && config.secretAccessKey) {
      s3Config.credentials = {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      };
    }

    this.client = new S3Client(s3Config);
  }

  async generatePresignedUploadUrl(params: {
    taskId: string;
    actorId: string;
    fileName: string;
    contentType: string;
    expiresInSeconds?: number | undefined;
  }): Promise<PresignedUploadResult> {
    const uniqueId = randomUUID();
    const objectKey = `tasks/${params.taskId}/evidence/${uniqueId}_${params.fileName}`;
    const expiresIn = params.expiresInSeconds ?? 900;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ContentType: params.contentType,
      Metadata: {
        taskId: params.taskId,
        uploadedBy: params.actorId,
      },
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      objectKey,
      storageRef: `s3://${this.bucket}/${objectKey}`,
      uploadUrl,
      expiresAt,
    };
  }

  async generatePresignedDownloadUrl(objectKey: string, expiresInSeconds = 900): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async getObjectMetadata(objectKey: string): Promise<ObjectMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      });
      const response = await this.client.send(command);
      const etag = response.ETag?.replace(/"/g, '');
      const meta: ObjectMetadata = {
        sizeBytes: response.ContentLength ?? 0,
        contentType: response.ContentType ?? 'application/octet-stream',
      };
      if (etag !== undefined) {
        meta.etag = etag;
      }
      if (response.Metadata) {
        meta.taskId = response.Metadata['taskid'] ?? response.Metadata['taskId'];
        meta.uploadedBy = response.Metadata['uploadedby'] ?? response.Metadata['uploadedBy'];
      }
      return meta;
    } catch (err: unknown) {
      const awsErr = err as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (awsErr.name === 'NotFound' || awsErr.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  async getObjectIntegrity(objectKey: string): Promise<ObjectIntegrity | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      });
      const response = await this.client.send(command);
      if (!response.Body) {
        return null;
      }

      const hash = createHash('sha256');
      let byteLength = 0;
      for await (const chunk of response.Body as AsyncIterable<Buffer | Uint8Array>) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        byteLength += buf.length;
        hash.update(buf);
      }
      const sha256 = hash.digest('hex');
      const etag = response.ETag?.replace(/"/g, '');

      const out: ObjectIntegrity = {
        sizeBytes: response.ContentLength ?? byteLength,
        contentType: response.ContentType ?? 'application/octet-stream',
        sha256,
      };
      if (etag !== undefined) {
        out.etag = etag;
      }
      if (response.Metadata) {
        out.taskId = response.Metadata['taskid'] ?? response.Metadata['taskId'];
        out.uploadedBy = response.Metadata['uploadedby'] ?? response.Metadata['uploadedBy'];
      }
      return out;
    } catch (err: unknown) {
      const awsErr = err as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (awsErr.name === 'NoSuchKey' || awsErr.name === 'NotFound' || awsErr.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  async deleteObject(objectKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
    });
    await this.client.send(command);
  }

  async putObjectDirect(params: {
    objectKey: string;
    data: Buffer;
    contentType: string;
    metadata?:
      | {
          taskId?: string | undefined;
          uploadedBy?: string | undefined;
        }
      | undefined;
  }): Promise<{ sha256: string; etag?: string }> {
    const s3Metadata: Record<string, string> = {};
    if (params.metadata?.taskId) s3Metadata.taskid = params.metadata.taskId;
    if (params.metadata?.uploadedBy) s3Metadata.uploadedby = params.metadata.uploadedBy;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: params.objectKey,
      Body: params.data,
      ContentType: params.contentType,
      ...(Object.keys(s3Metadata).length > 0 ? { Metadata: s3Metadata } : {}),
    });
    const result = await this.client.send(command);
    const etag = result.ETag?.replace(/"/g, '');
    const sha256 = createHash('sha256').update(params.data).digest('hex');
    const out: { sha256: string; etag?: string } = { sha256 };
    if (etag !== undefined) {
      out.etag = etag;
    }
    return out;
  }
}
