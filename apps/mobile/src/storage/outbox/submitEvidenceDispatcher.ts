import type { CanonicalTaskDto, SubmitEvidenceRequest } from '@novyx/contracts';
import type { IOutboxDispatcher } from './outboxCoordinator';
import type { OutboxItem } from './types';
import type { IMobileTaskRepository } from '../task/mobileTaskRepository';
import type { IDurableOutboxRepository } from './outboxRepository';
import type { EvidenceUploadClient } from '../../services/evidenceUploadClient';
import { MobileApiClient, MobileApiError } from '../../services/mobileApiClient';
import { assertNoIdempotencyKeyInBody } from './stateSeparation';

export class SubmitEvidenceOutboxDispatcher implements IOutboxDispatcher {
  private apiClient: MobileApiClient;
  private uploadClient: EvidenceUploadClient;
  private taskRepo: IMobileTaskRepository;
  private outboxRepo?: IDurableOutboxRepository;

  constructor(
    apiClient: MobileApiClient,
    uploadClient: EvidenceUploadClient,
    taskRepo: IMobileTaskRepository,
    outboxRepo?: IDurableOutboxRepository,
  ) {
    this.apiClient = apiClient;
    this.uploadClient = uploadClient;
    this.taskRepo = taskRepo;
    this.outboxRepo = outboxRepo;
  }

  async dispatch(item: OutboxItem): Promise<{
    success: boolean;
    status?: number;
    error?: string;
    serverTask?: CanonicalTaskDto;
  }> {
    if (item.commandType !== 'SubmitEvidence') {
      return {
        success: false,
        status: 400,
        error: `Unsupported command type: ${item.commandType}`,
      };
    }

    let parsedRequest: SubmitEvidenceRequest;
    try {
      parsedRequest = JSON.parse(item.payloadJson) as SubmitEvidenceRequest;
    } catch {
      return {
        success: false,
        status: 400,
        error: 'Outbox item payload is not valid JSON',
      };
    }

    // P13W5A-N04 / Section 19: Invariant: payload body must NOT contain Idempotency-Key
    assertNoIdempotencyKeyInBody(parsedRequest);

    try {
      let canonicalRequest: SubmitEvidenceRequest;

      // If the request is already canonical (e.g. durable storageRef/objectKey on replay), skip upload
      if (this.isAlreadyCanonical(parsedRequest)) {
        canonicalRequest = parsedRequest;
      } else {
        // Step 1: Query local evidence metadata records associated with this task
        const localEvidenceList = await this.taskRepo.listEvidenceByTask(item.taskId);

        // Step 2: Upload each local evidence file via Presign -> Binary PUT pipeline
        const uriToDurableRef = new Map<string, string>();
        const stageToDurableRef = new Map<string, string>();
        const conditionRefs: string[] = [];

        for (const ev of localEvidenceList) {
          const uploadResult = await this.uploadClient.uploadEvidence(item.taskId, {
            localFileUri: ev.sandboxFileUri,
            fileName: ev.fileName,
            contentType: ev.contentType,
            sizeBytes: ev.sizeBytes,
            sha256: ev.sha256,
          });

          // Store durable identity (storageRef or objectKey)
          const durableRef = uploadResult.storageRef || uploadResult.objectKey;
          uriToDurableRef.set(ev.sandboxFileUri, durableRef);
          uriToDurableRef.set(ev.id, durableRef);
          stageToDurableRef.set(ev.stage, durableRef);

          if (ev.stage === 'CONDITION') {
            conditionRefs.push(durableRef);
          }
        }

        // Step 3: Transform local photo URIs in SubmitEvidenceRequest into canonical durable references
        canonicalRequest = this.transformProofUris(parsedRequest, uriToDurableRef, stageToDurableRef, conditionRefs);
      }

      // Step 5: Ensure no file:// or temporary URLs remain in the canonical request
      this.assertNoLocalOrTemporaryUris(canonicalRequest);

      // Step 6: 5B-R01 / Section 4: DURABLY persist canonical request into same Outbox row BEFORE final POST
      if (this.outboxRepo) {
        await this.outboxRepo.updatePayload(item.id, JSON.stringify(canonicalRequest));
      }
      item.payloadJson = JSON.stringify(canonicalRequest);

      // Step 7: Dispatch canonical SubmitEvidence to server with Idempotency-Key HEADER
      const response = await this.apiClient.post<CanonicalTaskDto>(
        `/v1/tasks/${item.taskId}/evidence`,
        canonicalRequest,
        {
          idempotencyKey: item.idempotencyKey,
        },
      );

      // Step 8: Return authoritative result
      return {
        success: true,
        status: 200,
        serverTask: response,
      };
    } catch (err) {
      if (err instanceof MobileApiError) {
        // Section 27: Conflict reconciliation (HTTP 409)
        // Fetch current authoritative task state from server if possible
        if (err.status === 409) {
          let currentServerTask: CanonicalTaskDto | undefined;
          try {
            currentServerTask = await this.apiClient.get<CanonicalTaskDto>(`/v1/tasks/${item.taskId}`);
          } catch {
            // retain undefined if fetch fails
          }

          return {
            success: false,
            status: 409,
            error: err.message,
            serverTask: currentServerTask,
          };
        }

        return {
          success: false,
          status: err.status,
          error: err.message,
        };
      }

      return {
        success: false,
        status: 0,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Section 17 & 18: Replaces local photo URIs with durable storageRef/objectKey
   * across all three ProofProfiles (CHANGE_PROOF, SERVICE_PROOF, INSPECTION_PROOF)
   * as well as LocationException and IdentityException.
   */
  private transformProofUris(
    request: SubmitEvidenceRequest,
    uriMap: Map<string, string>,
    stageMap: Map<string, string>,
    conditionRefs: string[],
  ): SubmitEvidenceRequest {
    const cloned: SubmitEvidenceRequest = JSON.parse(JSON.stringify(request));

    const resolveRef = (uri?: string, stageFallback?: string): string => {
      if (!uri) return uri ?? '';
      return uriMap.get(uri) ?? (stageFallback ? stageMap.get(stageFallback) : undefined) ?? uri;
    };

    if (cloned.proof.proofProfile === 'CHANGE_PROOF') {
      cloned.proof.beforePhotoUri = resolveRef(cloned.proof.beforePhotoUri, 'BEFORE');
      cloned.proof.afterPhotoUri = resolveRef(cloned.proof.afterPhotoUri, 'AFTER');
    } else if (cloned.proof.proofProfile === 'SERVICE_PROOF') {
      cloned.proof.completionPhotoUri = resolveRef(cloned.proof.completionPhotoUri, 'COMPLETION');
    } else if (cloned.proof.proofProfile === 'INSPECTION_PROOF') {
      if (conditionRefs.length > 0) {
        cloned.proof.conditionPhotos = conditionRefs;
      } else {
        cloned.proof.conditionPhotos = cloned.proof.conditionPhotos.map((uri) => resolveRef(uri, 'CONDITION'));
      }
    }

    if (cloned.locationException?.explanationPhotoUri) {
      cloned.locationException.explanationPhotoUri = resolveRef(
        cloned.locationException.explanationPhotoUri,
        'EXCEPTION',
      );
    }

    if (cloned.identityException?.damagedQrPhotoUri) {
      cloned.identityException.damagedQrPhotoUri = resolveRef(cloned.identityException.damagedQrPhotoUri, 'EXCEPTION');
    }

    return cloned;
  }

  private assertNoLocalOrTemporaryUris(request: SubmitEvidenceRequest): void {
    const urisToCheck: string[] = [];

    if (request.proof.proofProfile === 'CHANGE_PROOF') {
      urisToCheck.push(request.proof.beforePhotoUri, request.proof.afterPhotoUri);
    } else if (request.proof.proofProfile === 'SERVICE_PROOF') {
      urisToCheck.push(request.proof.completionPhotoUri);
    } else if (request.proof.proofProfile === 'INSPECTION_PROOF') {
      urisToCheck.push(...request.proof.conditionPhotos);
    }

    if (request.locationException?.explanationPhotoUri) {
      urisToCheck.push(request.locationException.explanationPhotoUri);
    }
    if (request.identityException?.damagedQrPhotoUri) {
      urisToCheck.push(request.identityException.damagedQrPhotoUri);
    }

    for (const uri of urisToCheck) {
      if (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('asset-library://')) {
        throw new Error(`Forbidden: local file URI "${uri}" cannot be submitted as durable server evidence`);
      }
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        throw new Error(
          `Forbidden: temporary HTTP/HTTPS presigned URL "${uri}" cannot be submitted as durable server evidence`,
        );
      }
    }
  }

  private isAlreadyCanonical(request: SubmitEvidenceRequest): boolean {
    const urisToCheck: string[] = [];
    if (request.proof.proofProfile === 'CHANGE_PROOF') {
      urisToCheck.push(request.proof.beforePhotoUri, request.proof.afterPhotoUri);
    } else if (request.proof.proofProfile === 'SERVICE_PROOF') {
      urisToCheck.push(request.proof.completionPhotoUri);
    } else if (request.proof.proofProfile === 'INSPECTION_PROOF') {
      urisToCheck.push(...request.proof.conditionPhotos);
    }

    if (request.locationException?.explanationPhotoUri) {
      urisToCheck.push(request.locationException.explanationPhotoUri);
    }
    if (request.identityException?.damagedQrPhotoUri) {
      urisToCheck.push(request.identityException.damagedQrPhotoUri);
    }

    return (
      urisToCheck.length > 0 &&
      urisToCheck.every(
        (u) =>
          !u.startsWith('file://') &&
          !u.startsWith('content://') &&
          !u.startsWith('asset-library://') &&
          !u.startsWith('http://') &&
          !u.startsWith('https://'),
      )
    );
  }
}
